




// ----------- view ----------- //



// -- -- -- -- view -- -- -- -- //



// ----------- model ----------- //

class Hint {
  constructor(title, body) {
    this.title = title;
    this.body = body;
  }
}

class Topic {
  constructor(title, hints) {
    this.title = title;
    this.hints = hints;
  }
}


// -- -- -- -- model -- -- -- -- //

// ----------- controller ----------- //

class HintModule {

  constructor() {

    // init model
    this.topics = [];
    if(!HintModule.topics) this.initTopics();

    // init & setup view


  }

  // model manipulation methods

  initTopics() {
    for(let name of Object.keys(HintModule.topicData)) {
      const hints = [];
      for(let hintData of HintModule.topicData[name]) {
        hints.push(new Hint)
      }
    }
  }

  loadTopics(list) {
    for(let name of list) this.loadTopic(name);
  }

  loadTopic(name) {

    const data = HintModule.topics[name];
    if(!data) return;

    const hints = [];

    const topic = new Topic(name, hints);
    this.topics.push(topic);

  }




}


// -- -- -- -- controller -- -- -- -- //


// ----------- data ----------- //

HintModule.topicData = {

  'Friends' : [
    ["Play with Friends", "% _join_ to go to any lobby hosted by friends"],
    ["Add Friends", "% _friends_ to enter a player's code"],
    ["Remove Friends", "% any friend's name to un-friend"],
    ["Add from History", "% any player's name in your history to friend"],
  ],

  'Joining the Battle' : [
    ["Join Match", "% _JOIN_ to play on team of your choice"],
  ],

  'Private Lobby' : [
    ["Share", "Friends can join you by sending them a link"],
    ["Lobby Options", "% _options_ to adjust the settings"],
  ],

  'Practice Lobby' : [
    ["Lobby Options", "% _options_ to adjust the settings"],
    ["Player Limit", "Only one player can participate at a time"],
  ],

  'Other' : [
    ["Spectators", "Sharing a link to this lobby, others can watch"],
  ]

};

// -- -- -- -- data -- -- -- -- //