
class User {

  constructor() {
    this.id = ENV.storage.id;
    this.name = ENV.storage.user_name;
    this.rank = ENV.storage.rank;

    // this is a number from 0 to 599
    this.simple_rank = ENV.storage.simple_rank;

    if(this.id && !(this.simple_rank >= 0)) {
      this.resetRank();
    } else {
      this.refreshUserView();
    }

    this.watch('id', this.idChangeHandler)
    this.watch('name', this.nameChangeHandler)
    this.watch('rank', this.propChangeHandler)
    this.watch('simple_rank', this.propChangeHandler)
  }

  refreshUserView() {
    this.refreshUserNameView();
    this.refreshUserRankView();
  }
  refreshUserNameView(name = this.name) {var name_node = document.querySelector('#user_info_name'); if(name_node) name_node.textContent = name || 'Welcome';}
  refreshUserRankView() {var rank_node = document.querySelector('#user_info_rank'); if(rank_node) rank_node.textContent = (this.name && (this.simple_rank >= 0)) ? (`${this.rank_letter} ${this.rank_number}`) : '';}

  get rank_letter() {
    return ['E', 'D', 'C', 'B', 'A', 'M'][parseInt(this.simple_rank/100)]
  }
  get rank_number() {
    return this.simple_rank%100
  }

  idChangeHandler(prop, old_value, new_value) {
    ENV.storage.id = new_value;
    if(old_value != new_value) this.resetRank()
    return new_value;
  }

  nameChangeHandler(prop, old_value, new_value) {
    ENV.storage.user_name = new_value;
    this.refreshUserNameView(new_value)
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

}
