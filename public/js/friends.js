
// function listHistory(callback) {
//   var pp = ENV.storage.previous_players;
//   if(pp) {
//     pp = JSON.parse(pp);
//
//     $.ajax({
//       url: '/online_status',
//       type: 'POST',
//       data: JSON.stringify({ history: pp }),
//       contentType: 'application/json; charset=utf-8',
//       dataType: 'json'
//     })
//     .done(function( list ) {
//       list = list.reverse();
//       for(var user of list) {
//         var a = document.createElement('a'); a.href = `${location.origin}/${user[1]}`;
//         var span = document.createElement('span'); span.className = 'mi'; span.textContent = user[0];
//
//         a.appendChild(span);
//
//         $('.menu').append(a);
//
//         // <a href="/friends"><input type="submit" value="with friends"></a>
//
//         console.log(user)
//       }
//       callback();
//     });
//
//   }
// }
// $(() => {
//   listHistory(()=>{
//
//     $('.mi:not([disabled])').mouseover(jqEvent => {
//       $('.mi').removeClass('selected');
//       var span = jqEvent.currentTarget;
//       span.classList.add('selected')
//       ENV.sound.play('item-hover');
//     });
//     $('.mi:not([disabled])').mouseout(jqEvent => {
//       var span = jqEvent.currentTarget;
//       span.classList.remove('selected')
//     });
//
//   });
// })


class Friends {

  constructor() {

    this.historyLimit = 24;

    this.loadState();

  }

  // interfacing with storage

  loadState() {

    const history = this.parseMap(ENV.storage.history) || new Map();
    const friends = this.parseMap(ENV.storage.friends) || new Map();

    this.history = history;
    this.friends = friends;

  }

  saveState() {

    ENV.storage.history = this.stringifyMap(this.history);
    ENV.storage.friends = this.stringifyMap(this.friends);

  }

  stringifyMap(map) {
    return JSON.stringify(Array.from(map))
  }

  parseMap(string) {

    let map;

    try {
      map = new Map(JSON.parse(string));
    } catch(e) {}

    return map;

  }


  // interfacing with the server




  // interfacing with friends class

  addFriend(code, name) {
    this.friends.set(code, name);
    this.saveState();
  }

  setFriendName(code, name) {
    this.friends.set(code, name);
    this.saveState();
  }

  deleteFriend(code) {
    this.friends.delete(code)
    this.saveState();
  }

  addHistory(list) {
    for(let [code, name] of list)
      this.history.set(code, name);
    while(this.history.size > this.historyLimit) _(this.history).draw();
    this.saveState();
  }
  
  clearHistory() {
    this.history.clear();
    this.saveState();
  }


}



