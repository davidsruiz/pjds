
"use strict";


const Lobby = require('./server_lobby.js');

const Utilities = {

  median :
    list => {

      list = list.sort((a, b) => a - b);

      const half = Math.floor(list.length/2);

      if(list.length % 2)
        return list[half];
      else
        return (list[half-1] + list[half]) / 2.0;

    },

  mean : list => list.reduce((a, b) => a + b, 0) / list.length,

  sqrDiff : (list, reference) => list.map(number => Math.pow(number - reference, 2)),

  standardDeviation : list => Math.sqrt(Utilities.mean(Utilities.sqrDiff(list, Utilities.mean(list)))),

  deviation : list => Math.sqrt(Utilities.mean(Utilities.sqrDiff(list, Utilities.median(list)))),



  // clear array

  clearArray: array => { while(array.length) array.pop() },

};



class RankedLobby extends Lobby {

  constructor(id, type, requestLobbyFunction, waitThenCheckLobbyFunction, cycles, options = {}) {
    super(id, type, options);

    Utilities.clearArray(this.editableSettings);


    // request lobby for player using rank
    //  ( this is a function provided by the lobby manager )
    this.requestLobby = requestLobbyFunction;
    this.waitThenUpdateAvailabilityStatus = waitThenCheckLobbyFunction;

    this.cycles = cycles;
    this.cycles.addListener('rotationUpdate', ()=>this.rotationUpdated());

    this.syncLobbyRotation();

  }

  get rotation() { return this.cycles.rotation }
  get nextChange() { return this.cycles.nextChangeTime }

  get rank() {
    return [...this.playersMap.values()].map(data => data[1]).reduce((a, b) => a + b, 0) / this.playersMap.size;
  }

  endGame() {
    super.endGame();

    // // client and ranks from connected players
    // const clientRanks = [...this.playersMap].map(([client, data]) => [client, Number(data[1]).valueOf()]);
    // const ranks = clientRanks.map(i => i[1]);
    // const median = Utilities.median(ranks);
    // const dev = Utilities.deviation(ranks);
    //
    // const above = [];
    // const below = [];
    //
    // for(let [client, rank] of clientRanks) {
    //
    //   // any client's rank out of bounds is redirected
    //   if(rank > median + dev) {
    //     above.push([client, rank]);
    //   } else if(rank < median - dev) {
    //     below.push([client, rank]);
    //   }
    //
    // }
    //
    // let newLobbyID;
    //
    // newLobbyID = this.requestLobby(Utilities.median(above.map(i => i[1])));
    // for(let [client, ] of above) {
    //   client.emit('shouldChangeLobby', newLobbyID);
    // }
    //
    // newLobbyID = this.requestLobby(Utilities.median(below.map(i => i[1])));
    // for(let [client, ] of below) {
    //   client.emit('shouldChangeLobby', newLobbyID);
    // }
    //
    // this.waitThenUpdateAvailabilityStatus(this, 10000);

  }

  syncLobbyRotation() {

    const {map, mode} = this.rotation;

    this.options['map'] = map;
    this.options['mode'] = mode;

  }

  rotationUpdated() {

    const rotation = this.rotation;
    const nextChange = this.nextChange;
    const {map, mode} = rotation;

    this.options['map'] = map;
    this.options['mode'] = mode;

    this.emit('optionsUpdate', ['map', map]);
    this.emit('optionsUpdate', ['mode', mode]);
    this.emit('rotationUpdate', {rotation, nextChange});

  }


  updateUserRank(client, rank) {

    super.updateUserRank(client, rank);
    this.evaluatePlayerRank(client, rank);



  }

  evaluatePlayerRank(client, rank) {

    // client and ranks from connected players
    const ranks = [...this.playersMap].map(([client, data]) => Number(data[1]).valueOf());
    const median = Utilities.median(ranks);
    const dev = Utilities.deviation(ranks);

    if(rank > median + dev || rank < median - dev) {
      client.emit('shouldChangeLobby', this.requestLobby(rank));
      this.waitThenUpdateAvailabilityStatus(this, 10000);
    }

  }


  map() {

    // 1. Do regular things
    const map = super.map();


    // 2. Add special ranked lobby things, like:
    // 2a. Rotation info
    map.rotation = this.rotation;
    map.nextChange = this.nextChange;


    // 3. Return
    return map;

  }

  emitAllLobbyData() {
    this.emit('lobbyUpdate', this.map());
  }






}





module.exports = RankedLobby;
