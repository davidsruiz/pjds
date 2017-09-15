
$(()=>{

  ENV.friends = new Friends();
  ENV.friends_page = new FriendsPage(ENV.friends);

});


class DSGameFriends extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      lobbyOptionsShown: false,
    }
  }

  lobbyOptionsToggle() {
    this.setState({
      lobbyOptionsShown: !this.state.lobbyOptionsShown
    })
  }

  friendPlayer(data) { // data == [code, name]
    ENV.friends_page.friendPlayer(data);
  }

  unfriendPlayer(data) { // data == [code, name]
    ENV.friends_page.unfriendPlayer(data);
  }

  render() {

    const {lobbies, unavailable, history} = this.props.data;

    return (
      <div id="ds-game-friends" className="parent-container">
        <div id="part-1" className="split-view-part1">
          <IconBar />
          <FriendsHeader />
          <LobbiesSection lobbies={lobbies} onClick={data => this.unfriendPlayer(data)} />
        </div>
        <div id="part-2" className="split-view-part2">
          <UnavailableSection unavailable={unavailable} onClick={data => this.unfriendPlayer(data)} />
          <HistorySection history={history} onClick={data => this.friendPlayer(data)} />
        </div>
      </div>
    );
  }
}


class FriendsHeader extends React.Component {

  handleAddFriendClick() {
    ENV.friends_page.enterFriendCode();
  }

  render() {
    return (
      <div id="friends-header">
        <span id="friends-header-title" className="header-1">{FRIENDS_REF.title}</span>
        <span id="friends-header-desc" className="lobby-text">{FRIENDS_REF.description}</span>
        <div id="friends-header-button-row">
          <span className="lobby-button" onClick={() => this.handleAddFriendClick()}>add friend</span>
        </div>
      </div>
    );
  }
}

class LobbiesSection extends React.Component {

  handleHostMatchClick() {
    ENV.friends_page.hostMatch();
  }

  handleJoinClick(lobbyID) {
    window.location = `${window.location.origin}/${lobbyID}`
  }

  render() {

    const rows = [];
    for(let lobby of this.props.lobbies)
      rows.push(<LobbyRow key={lobby[0]} lobby={lobby} onJoin={(lobbyID) => this.handleJoinClick(lobbyID)} onClick={data => this.props.onClick(data)} />)
    if(rows.length == 0)
      rows.push(<span key={'---'} className="filler-text">none</span>);

    return (
      <div id="friends-lobby-section">
        <div className="title-row">
          <span className="header-2">{'JOINABLE'}</span>
          <span className="lobby-button" onClick={() => this.handleHostMatchClick()}>host match</span>
        </div>
        {rows}
      </div>
    );
  }
}

class LobbyRow extends React.Component {

  render() {

    const lobbyID = this.props.lobby[0];
    const players = this.props.lobby.slice(1);
    const playerList = [];

    for(let [code, name] of players)
      playerList.push(<PlayerButton key={code} code={code} name={name} onClick={data => this.props.onClick(data)} />)

    return (
      <div className="lobby-row">
        <div className="lobby-row-info-group">
          <span className="lobby-id">{lobbyID.toUpperCase()}</span>
          <div className="player-list">
            {playerList}
          </div>
        </div>
        <span className="lobby-button" onClick={() => this.props.onJoin(lobbyID)}>join</span>
      </div>
    );
  }
}

class PlayerButton extends React.Component {

  render() {
    return (
      <span
        className="player-button"
        onClick={() => this.props.onClick([this.props.code, this.props.name])}>{this.props.name || '---'}</span>
    );
  }
}

class UnavailableSection extends React.Component {

  render() {

    const rows = [];
    for(let [code, name] of this.props.unavailable)
      rows.push(<PlayerButton key={code} code={code} name={name} onClick={data => this.props.onClick(data)} />)
    if(rows.length == 0)
      rows.push(<span key={'---'} className="filler-text">none</span>);

    return (
      <div id="friends-unavailable-section" className="split-view-part1">
        <div className="title-row">
          <span className="header-2">{'NOT AVAILABLE'}</span>
        </div>
        {rows}
      </div>
    );

  }
}

class HistorySection extends React.Component {

  handleClearHistoryClick() {
    ENV.friends_page.clearHistory();
  }

  render() {

    const empty = this.props.history.length == 0;
    const buttonTitle = 'clear';
    const onClick = empty ? ()=>{} : () => this.handleClearHistoryClick();
    const rows = [];

    if(!empty) {

      for(let [code, name] of this.props.history)
        rows.push(<PlayerButton key={code} code={code} name={name} onClick={data => this.props.onClick(data)} />)

    } else {

      rows.push(<span key={'---'} className="filler-text">none</span>);

    }

    return (
      <div id="friends-history-section" className="split-view-part2">
        <div className="title-row">
          <span className="header-2">{'HISTORY'}</span>
          <span className="lobby-button" disabled={empty} onClick={onClick}>{buttonTitle}</span>
        </div>
        {rows}
      </div>
    );

  }
}

class IconBar extends React.Component {
  render() {

    const homeAction = () => window.location.reset();

    return (
      <div id="icon-bar">
        <IconButton iconName="home" onClick={() => homeAction()}/>
        <IconButton iconName="volume_up" />
        <IconButton iconName="help" />
        <IconButton iconName="settings" />
      </div>
    );
  }
}

class IconButton extends React.Component {

  render() {
    return (
      <button className={this.props.iconName + '_icon'} onClick={() => this.props.onClick()}><i className="material-icons">{this.props.iconName}</i></button>
    );
  }
}






let sendSAMPLEDATA = ['4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', ];

let receiveSAMPLEDATA = {

  lobbies: [
    ['Dks73k', '4a50adb3', '4a50adb3', ],
    ['HJKADF', '4a50adb3', '4a50adb3', ],
    ['BJ5QBE', '4a50adb3', ],
  ],

  unavailable: [
    '4a50adb3',
    '4a50adb3',
    '4a50adb3',
    '4a50adb3',
    '4a50adb3',
  ],

  names: [
    ['bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro', 'bro', ],
    ['4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', '4a50adb3', ],
  ],

};

let dataSAMPLEDATA = {

  lobbies: [
    ['Dks73k', ['4a50adb3', 'bro'], ['4a50adb3', 'bro']],
    ['HJKADF', ['4a50adb3', 'bro'], ['4a50adb3', 'bro']],
    ['BJ5QBE', ['4a50adb3', 'bro'], ['4a50adb3', 'bro']],
  ],

  unavailable: [
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
  ],

  history: [
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
    ['4a50adb3', 'bro'],
  ],

};


class FriendsPage {

  constructor(adapter) {

    // interface with local player record
    this.adapter = adapter;

    // data formatted for React
    this.data = { lobbies: [], unavailable: [], history: [] };

    this.loadHistory();     // fill history portion
    this.contactServer();   // fill lobbies/unavailable portion

  }


  // [- Process -]
  // 1. a friends list will be sent to find out who is available to play
  // 2. the server responds with the names and lobbies of connected players

  contactServer() {

    const IDList = Array.from(this.adapter.friends).map(a => a[0]); // from map to 1d arr.

    $.ajax({
      url: '/online_status',
      type: 'POST',
      data: JSON.stringify({ list: IDList }),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    })
      .done(data => this.serverResponded(data));

  }

  serverResponded(data) { console.log(data);

    // sync names from server
    this.setNames(data.names);


    // lobbies
    this.data.lobbies = [];
    for(let lobby of data.lobbies) {
      const convertedLobby = [];
      convertedLobby.push(lobby.shift())
      for(let code of lobby)
        convertedLobby.push(this.namedPairFor(code))
      this.data.lobbies.push(convertedLobby);
    }

    // unavailable
    this.data.unavailable = data.unavailable.map(code => this.namedPairFor(code));


    // refresh React
    this.loadHistory();
    this.render();

  }


  setNames(namesList) {
    for(let [id, name] of namesList)
      this.adapter.setFriendName(id, name);
  }

  namedPairFor(code) {
    return [code, this.adapter.friends.get(code)];
  }



  friendPlayer([code, name]) {
    
    if(!window.confirm(FRIENDS_REF.friendQuestion(name))) return;

    if(this.adapter.friends.has(code)) return;

    this.adapter.addFriend(code, name);

    this.contactServer();

  }

  unfriendPlayer([code, name]) {

    if(!window.confirm(FRIENDS_REF.unfriendQuestion(name))) return;

    if(!this.adapter.friends.has(code)) return;

    this.adapter.deleteFriend(code);
    this.loadHistory();
    this.render();

    this.contactServer();

  }


  // for host button
  hostMatch() {

    const method = 'post';
    const url = '/create';

    const form = $('<form>', {
      method: method,
      action: url
    });

    $('body').append(form);
    form.submit();


    // $.ajax({
    //   url: '/create',
    //   type: 'POST',
    // }).done(
    //   data => data.redirect ? window.location.href = data.redirect : 0
    // );


    // <form action="/create" method="POST"><input type="submit" value="host"></form>
  }

  loadHistory() {
    let history = Array.from(this.adapter.history); // map to 2d arr.

    history = _(history).reject(p => this.adapter.friends.has(p[0])); // filter out any friends

    this.data.history = history; // assign
  }

  clearHistory() {

    if(!window.confirm(FRIENDS_REF.clearHistoryQuestion)) return;

    this.adapter.clearHistory();
    this.loadHistory();
    this.render();

  }

  enterFriendCode() {

    const response = window.prompt(`Enter a friends ID code.\nHere is yours to copy:`, ENV.user.id)
    const passedValidation = /^(\d|\w){8}$/.test(response);
    const isNotOurOwn = response != ENV.user.id;


    if(passedValidation && isNotOurOwn) {

      this.adapter.addFriend(response);
      this.contactServer();

    } else {
      console.log(`ID (${response}) was rejected as a friend. see enterFriendCode`);
    }

  }


  render() {
    ReactDOM.render(
      <DSGameFriends data={this.data} />,
      document.getElementById('container')
    );
  }

}


const FRIENDS_REF = {
  title: `FRIENDS`,
  description: `Add friends to join them when they’re online.\nYou can also find recent players here.`,
  friendQuestion: name => `Add ${name || 'this player'} as a friend?`,
  unfriendQuestion: name => `Remove ${name || 'this player'} as a friend?`,
  clearHistoryQuestion: `Clear history?`,
}