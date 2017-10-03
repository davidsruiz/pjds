
class User {

  constructor() {
    this.id = ENV.storage.id;
    this.name = ENV.storage.user_name;
    this.rank = ENV.storage.rank;
    this.money = ENV.storage.money;

    this.simple_rank = ENV.storage.simple_rank; // this is a number from 0 to 599
    this.simple_money = ENV.storage.simple_money;

    this.stats = {};
    this.stats.wins = ENV.storage.wins;
    this.stats.losses = ENV.storage.losses;
    this.stats.kills = ENV.storage.kills;
    this.stats.deaths = ENV.storage.deaths;


    const simpleRankIsInvalid = !(this.simple_rank >= 0);

    if(this.id && simpleRankIsInvalid) { // if id and invalid rank, reset
      this.resetRank();
    } else {
      this.refreshUserMiniView();
    }



    this.watch('id', this.idChangeHandler);
    this.watch('name', this.nameChangeHandler);
    this.watch('rank', this.propChangeHandler);
    this.watch('simple_rank', this.propChangeHandler);
    this.watch('money', this.propChangeHandler);
    this.watch('simple_money', this.propChangeHandler);

    this.stats.watch('wins', this.propChangeHandler);
    this.stats.watch('losses', this.propChangeHandler);
    this.stats.watch('kills', this.propChangeHandler);
    this.stats.watch('deaths', this.propChangeHandler);

    this.validateStats();

    // promises
    // this.get_id = () => {
    //   return new Promise((resolve, reject) => {
    //     if (this.id) {
    //       resolve(this.id);
    //     } else {
    //       $.ajax({
    //         url: '/id',
    //         type: 'POST'
    //       })
    //         .done(resolve);
    //     }
    //   });
    //
    // }
    // this.get_name = () => {
    //   return new Promise((resolve, reject) => {
    //     let name = this.name,
    //         validation = name => {
    //           // only alphanumeric and whitespace characters
    //           if(!(/^(\w|\s)+$/.test(name))) return false;
    //
    //           // no profanity
    //           if(swearjar.profane(name)) return false;
    //
    //           return true;
    //         }
    //
    //     while(!name || (name.trim()==="") || !validation(name)) {
    //       name = window.prompt('please enter a display name');
    //     }
    //
    //     this.name = name.trim();
    //     resolve(name);
    //   })
    // }

    // this.get_rank =

    this.listeners = new Map();
  }

  get get_rank() {
    return (new Promise((resolve, reject) => {
      if(this.simple_rank >= 0) {
        resolve(this.simple_rank);
      } else {
        this.resetRank(resolve, reject);
      }
    }));
  }

  refreshUserMiniView() {
    this.refreshUserNameMiniView();
    this.refreshUserRankMiniView();
    this.refreshUserMoneyMiniView();
  }
  refreshUserNameMiniView(name = this.name) {
    if(!userViewsAreAvailable()) return;

    const no_name_small = 'g';
    const no_name_large = 'guest';
    const node_small = document.querySelector('#umi_name_letter');
    const node_large = document.querySelector('#umi_name_full');
    const name_small = (name) ? name[0] : no_name_small;
    if(node_small && node_large) {
      node_small.textContent = name_small;
      node_large.textContent = name || no_name_large
    }
  }
  refreshUserRankMiniView() {
    if(!userViewsAreAvailable()) return;

    const box_node = document.querySelector('#user_mini_info');
    const rank_node = box_node.querySelector('#umi_stats_rank');
    if(this.name && this.simple_rank >= 0) {
      rank_node.textContent = `${this.rank_letter} ${this.rank_number}`;
      box_node.removeAttribute('limited');
    } else {
      box_node.setAttribute('limited', '');
    }
  }
  refreshUserMoneyMiniView() {
    if(!userViewsAreAvailable()) return;

    const box_node = document.querySelector('#user_mini_info');
    const money_node = box_node.querySelector('#umi_stats_currency');
    if(this.name && this.simple_rank >= 0 && this.simple_money >= 0) {
      money_node.textContent = this.simple_money;
      box_node.removeAttribute('limited');
    } else {
      box_node.setAttribute('limited', '');
    }
  }

  refreshUserViews() {
    this.refreshUserMiniView();
    this.refreshUserLayer();
  }

  refreshUserLayer() {
    if(!userViewsAreAvailable()) return;
    if(ENV.UA) ENV.UA.refreshUI();
  }

  get rank_letter() {
    return User.calculateRankLetter(this.simple_rank)
  }
  get rank_number() {
    return User.calculateRankNumber(this.simple_rank)
  }

  static calculateRankLetter(simple_rank) { return ['E', 'D', 'C', 'B', 'A', 'M'][parseInt(simple_rank/100)] }
  static calculateRankNumber(simple_rank) { return simple_rank%100 }
  static calculateRankString(simple_rank) { return `${User.calculateRankLetter(simple_rank)} ${User.calculateRankNumber(simple_rank)}` }

  idChangeHandler(prop, old_value, new_value) {
    ENV.storage.id = new_value;
    if(old_value != new_value) this.resetRank.wait(10);
    return new_value;
  }

  nameChangeHandler(prop, old_value, new_value) {
    ENV.storage.user_name = new_value;
    this.refreshUserNameMiniView(new_value);
    return new_value;
  }

  propChangeHandler(prop, old_value, new_value) {
    ENV.storage[prop] = new_value;
    return new_value;
  }

  resetRank(resolveCallback = ()=>{}, rejectCallback = ()=>{}) {
    $.ajax({
      url: '/rank',
      type: 'POST',
      data: JSON.stringify({ id: this.id }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    })
    .done(( data ) => {
      var {simple, encoded} = data;
      this.simple_rank = simple;
      this.rank = encoded;

      resolveCallback(simple);
      // this.refreshUserRankMiniView();
    })
    .fail(() => {
      rejectCallback();
    });
  }

  updateRank() {
    $.ajax({
      url: '/update_rank',
      type: 'POST',
      data: JSON.stringify({ rank: this.rank, id: this.id }),
      // data: JSON.stringify({ history: pp }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    })
    .done(( data ) => {
      var {simple, encoded} = data;
      this.simple_rank = simple;
      this.rank = encoded;

      this.refreshUserRankMiniView();
    });
  }

  updateStatsAjax() {
    $.ajax({
      url: '/update_stats',
      type: 'POST',
      data: JSON.stringify(
        [
          this.id,
          this.rank,
          this.money,
        ]
      ),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    })
      .done(([rank, money, simple_rank, simple_money]) => {

        this.rank = rank;
        this.money = money;
        this.simple_rank = simple_rank;
        this.simple_money = simple_money;

        this.execListeners('serverUpdate', {rank, money, simple_rank, simple_money});

        this.refreshUserViews();
      });
  }


  validateStats() {
    if(!(this.stats.wins >= 0)) this.stats.wins = 0;
    if(!(this.stats.losses >= 0)) this.stats.losses = 0;
    if(!(this.stats.kills >= 0)) this.stats.kills = 0;
    if(!(this.stats.deaths >= 0)) this.stats.deaths = 0;
  }

  resetStats() {
    this.stats.wins = 0;
    this.stats.losses = 0;
    this.stats.kills = 0;
    this.stats.deaths = 0;
  }

  // Listeners
  addListener(key, handler) {

    if(typeof handler !== 'function')
      return false;

    const listenerList = this.listeners.get(key) || [];
    listenerList.push(handler);
    this.listeners.set(key, listenerList);

    return true; // success

  }

  execListeners(key, info) {
    const listenerList = this.listeners.get(key) || [];
    for(let listener of listenerList)
      listener(info);
  }

  removeListener(key, handler) {
    const listenerList = this.listeners.get(key) || [];
    const indexOf = listenerList.indexOf(handler);
    if(indexOf === -1) return false; // failure
    listenerList.splice(indexOf, 1);
    return true; // success
  }

}

class UserAdapter {

  constructor(root) {
    this._root = root;

  }

  getName() {
    let name,
        default_name = 'user' + String(Math.randomIntMinMax(10, 10000)).padding(4, '0'),
        attempts = 0,
        validation = name => {
          // only alphanumeric and whitespace characters
          if(!(/^(\w|\s)+$/.test(name))) return false;

          // no profanity
          if(swearjar.profane(name)) return false;

          return true;
        };

    while(!name || (name.trim()==="") || !validation(name)) {
      if(++attempts > 3) { name = default_name }
      else { name = window.prompt('please enter a display name' + (attempts-1 ? ` (letters and numbers only please)` : ''), this._root.name || ''); }
    }

    name = name.trim().substring(0, 10);

    this._root.name = name;
    this.refreshUI();

    return name;
  }

  refreshUI() {
    // mini user info
    // mini user info end

    // user info content
    const name_set = !!ENV.user.name;
    const user_set = name_set && !!ENV.user.rank;

    //name
    $('#uic_title').val(ENV.user.name || '_name_');
    // edit button
    $('#uic_title_edit').text(name_set ? 'change' : 'set');

    if(user_set) {

      const friends = ENV.friends ? ENV.friends.friends.size : 0;
      const wins = ENV.user.stats.wins || 0;
      const losses = ENV.user.stats.losses || 0;
      const kills = ENV.user.stats.kills || 0;
      const deaths = ENV.user.stats.deaths || 0;
      let winRate = (wins/losses || 0).round(1);
      if(winRate > 10) winRate = '10+';

      $('#uic_money_cell').text(ENV.user.simple_money);
      $('#uic_rank_cell').text(ENV.user.rank_letter + ' - ' + ENV.user.rank_number);
      $('#uic_win_cell').text(winRate);
      $('#uic_friends_cell').text(friends);

      $('#uic_wins_row').text(wins);
      $('#uic_losses_row').text(losses);
      $('#uic_kills_row').text(kills);
      $('#uic_deaths_row').text(deaths);

      $('#uic_reset_button').removeAttr('disabled');
    } else {
      $('#uic_money_cell').text('-');
      $('#uic_rank_cell').text('-');
      $('#uic_win_cell').text('-');
      $('#uic_friends_cell').text('-');

      $('#uic_wins_row').text('-');
      $('#uic_losses_row').text('-');
      $('#uic_kills_row').text('-');
      $('#uic_deaths_row').text('-');

      $('#uic_reset_button').attr('disabled', 'true')
    }



  }

}

const userViewsAreAvailable = () => document.querySelector('#user_mini_info');

$(()=>{

  ENV.user = new User();
  if(ENV.storage.ongoing == 'true') { ENV.user.updateStatsAjax(); ENV.storage.ongoing = 'false' }

  if(userViewsAreAvailable()) { // revise ... make user always accessible with its view components optional

    ENV.UA = new UserAdapter(ENV.user);
    $('#uic_title_edit').click(jqEvent => { ENV.UA.getName() });
    $('#uic_reset_button').click(jqEvent => { ENV.user.resetStats(); ENV.UA.refreshUI(); })
    ENV.UA.refreshUI();


    $('#user_mini_info').click(jqEvent => { ENV.UA.refreshUI(); LOBBY.showLayer('#user_info_layer') });
    $('#user_info_background, #uic_close_button').click(jqEvent => { LOBBY.hideLayer('#user_info_layer') })

  }

});