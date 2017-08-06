
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

    if(this.id && !(this.simple_rank >= 0)) { // if id and invalid rank, reset
      this.resetRank();
    } else {
      this.refreshUserView();
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
  }

  refreshUserView() {
    this.refreshUserNameView();
    this.refreshUserRankView();
  }
  refreshUserNameView(name = this.name) {
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
  refreshUserRankView() {
    const box_node = document.querySelector('#user_mini_info');
    const rank_node = box_node.querySelector('#umi_stats_rank');
    if(this.name && this.simple_rank >= 0) {
      rank_node.textContent = `${this.rank_letter} ${this.rank_number}`;
      box_node.removeAttribute('limited');
    } else {
      box_node.setAttribute('limited', '');
    }
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
    this.refreshUserNameView(new_value);
    return new_value;
  }

  propChangeHandler(prop, old_value, new_value) {
    ENV.storage[prop] = new_value;
    return new_value;
  }

  resetRank() {
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

      this.refreshUserRankView();
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

      this.refreshUserRankView();
    });
  }

  validateStats() {
    if(!(this.stats.wins > 0)) this.stats.wins = 0;
    if(!(this.stats.losses > 0)) this.stats.losses = 0;
    if(!(this.stats.kills > 0)) this.stats.kills = 0;
    if(!(this.stats.deaths > 0)) this.stats.deaths = 0;
  }

  resetStats() {
    this.stats.wins = 0;
    this.stats.losses = 0;
    this.stats.kills = 0;
    this.stats.deaths = 0;
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
    $('#uic_title').val(ENV.user.name || '- name -');
    // edit button
    $('#uic_title_edit').text(name_set ? 'change' : 'set')

    if(user_set) {
      $('#uic_money_cell').text('0');
      $('#uic_rank_cell').text(User.calculateRankLetter() + ' - ' + User.calculateRankNumber());
      $('#uic_win_cell').text('0');
      $('#uic_friends_cell').text('0');

      $('#uic_wins_row').text('0');
      $('#uic_losses_row').text('0');
      $('#uic_kills_row').text('0');
      $('#uic_deaths_row').text('0');
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


$(()=>{
  ENV.user = new User();
  if(ENV.storage.ongoing == 'true') { ENV.user.updateRank(); ENV.storage.ongoing = 'false' }

  $('#user_mini_info').click(jqEvent => { LOBBY.showLayer('#user_info_layer') });
  $('#user_info_background, #uic_close_button').click(jqEvent => { LOBBY.hideLayer('#user_info_layer') })

  const UA = new UserAdapter(ENV.user);
  $('#uic_title_edit').click(jqEvent => { UA.getName() })
  UA.refreshUI();
})