
// function refreshLobbyView() {
//
//   // clear it up
//   $('span.mi').remove();
//
//   // populate
//   let players = ENV["lobby"]["players"];
//   players.forEach((id, player) => {
//
//     let name = player.name;
//     if(id == ENV.storage.id) {
//       let span = document.createElement('span'); span.className = 'mi';
//       let input = document.createElement('input'); input.id = "name-input";
//       input.type = "text";
//       input.placeholder = "your name";
//       input.value = name;
//       input.onkeydown = function(e) { if(e.keyCode==13) $(this).blur() };
//       input.oninput = function() { ENV.sound.play('type') };
//       input.onfocus = function() { editing = true };
//       input.onblur = function() { socket.emit('set name', this.value.substr(0, 24)); editing = false; refreshLobbyView() };
//       let row = document.createElement('span'); row.className = 'mi-row';
//       let select = document.createElement('select');
//       // let defoption = document.createElement('option'); defoption.disabled = true; defoption.textContent = "choose ship type";
//       // select.appendChild(defoption);
//       // let random_option = document.createElement('option'); random_option.textContent = "random"; random_option.value = types.sample();
//       // select.appendChild(random_option);
//       types.forEach(t => {
//         let option = document.createElement('option');
//         option.innerHTML = t;
//         select.appendChild(option);
//       });
//       select.value = ENV.storage.type || 'standard';//defoption.textContent;
//       select.onchange = function(e) { socket.emit('set type', this.value); ENV.storage.type = this.value; };
//       let team = document.createElement('select');
//       let no_team = document.createElement('option');
//       no_team.innerHTML = '-';
//       no_team.value = -1;
//       team.appendChild(no_team);
//       ENV.lobby.team_capacity.times(i => {
//         let option = document.createElement('option');
//         option.innerHTML = i+1;
//         option.value = i;
//         team.appendChild(option);
//       });
//       team.value = ENV.storage.team || -1;
//       team.onchange = function(e) { socket.emit('set team', this.value); ENV.storage.team = this.value; };
//       // let right = document.createElement('span');
//       let checkbox = document.createElement('input'); checkbox.type = "checkbox"; checkbox.name = "checkbox";
//       checkbox.onchange = function() { if(this.checked) { socket.emit('ready'); ENV.sound.play('ready') } };
//
//       row.appendChild(document.createTextNode("type:"));
//       row.appendChild(select);
//       if(ENV.lobby.type == 'private') row.appendChild(document.createTextNode("team:"));
//       if(ENV.lobby.type == 'private') row.appendChild(team);
//       if(player.cleared) row.appendChild(document.createTextNode("ready?"));
//       if(player.cleared) row.appendChild(checkbox); //row.appendChild(checkboxlabel);
//
//       span.appendChild(input);
//       span.appendChild(row);
//
//       $('.lobby > main').append(span);
//       if(player.ready) { input.disabled = true; select.disabled = true; checkbox.checked = true; checkbox.disabled = true; }
//     } else {
//       let span = document.createElement('span'); span.className = 'mi player'; span.textContent = name || 'connected..'; span.title = name;
//       $('.lobby > main').append(span);
//     }
//   });
//
//   let emptySlots =  ENV["lobby"]["capacity"] - Object.keys(players).length;
//   emptySlots.times(()=>{
//     let span = document.createElement('span'); span.className = 'mi vacant'; span.textContent = 'waiting for players...';
//     $('.lobby > main').append(span);
//   });
//
// }


let types = ['damage', 'speed', 'standard', 'rate', 'defense'];


// scroll view
// let resetScrollView = () => {
// var scroll_view = document.querySelector('#touch_layer .scroll');
// scroll_view.scrollTop = scroll_view.scrollHeight/2;
// };
// $(()=>resetScrollView());

var lastTouchEnd = 0;
document.documentElement.addEventListener('touchend', function (event) {
  var now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

window.addEventListener('load', ()=> {
  document.querySelector('#touch_layer').addEventListener('touchstart', function (event) { event.preventDefault() }, true);
  document.querySelector('#touch_layer').addEventListener('touchend', function (event) { event.preventDefault() }, false);
});



var TINT = {
  assortment: [
    ['#0000ff', '#ff0000'],
    ['#0000ff', '#aedc39'],
    ['#0048ff', '#cc00ff']
  ],

  shuffle() {
    let [c1, c2] = TINT.assortment.sample(), deg = Math.randomIntMinMax(15, 75);
    TINT.load(deg, c1, c2);
  },

  load(deg, c1, c2) {
    let elem = document.querySelector('#tint');
    if (elem) $(elem).css('background', `linear-gradient(${deg}deg, ${c1}, ${c2})`);
  }

};















class DSGameLobby extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // state.userEngagementPhase
      //   values: 0 - available to join
      //           1 - joined
      //           2 - locked in
      //           3 - not available to join
      userEngagementPhase:  0,
      lobbyOptionsShown: false,
    }
  }

  lobbyOptionsToggle() {
    this.setState({
      lobbyOptionsShown: !this.state.lobbyOptionsShown
    })
  }

  render() {
    const data = this.props.data;

    return (
      <div id="ds-game-lobby">
        <div id="part-1">
          <IconBar />
          <span id="logo-type">DEEP SPACE</span>
          <LobbyType type={data.type} />
          <LobbyActions code={data.code} prefs={data.game_settings} onClick={() => this.lobbyOptionsToggle()}/>
          <LobbyOptions prefs={data.game_settings} show={this.state.lobbyOptionsShown} />
        </div>
        <div id="part-2">
          <PlayerConfig userEngagementPhase={this.state.userEngagementPhase} />
          <LobbyUsers users={data.users} playerLimit={data.game_settings.player_capacity}/>
          {/*<div id="lobby-users">*/}
            {/*<PlayersTable />*/}
            {/*<SpectatorsTable />*/}
          {/*</div>*/}
        </div>
      </div>
    );
  }
}


class IconBar extends React.Component {
  render() {
    return (
      <div id="icon-bar">
        <IconButton iconName="home" />
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
      <button className={this.props.iconName + '_icon'}><i className="material-icons">{this.props.iconName}</i></button>
    );
  }
}

class LobbyType extends React.Component {
  render() {

    const name = (REF.lobby.type[this.props.type] + ' lobby').toUpperCase();
    const desc = REF.lobby.typeDesc[this.props.type];

    return (
      <div id="lobby-type">
        <span id="lobby-type-name">{name}</span>
        <span id="lobby-type-desc">{desc}</span>
      </div>
    );

  }
}

class LobbyActions extends React.Component {
  render() {
    const code = this.props.code;

    return (
      <div id="lobby-action">
        <span id="lobby-id">{code.toUpperCase()}</span>
        <div id="lobby-action-buttons">
          {/*<Button title="share" />*/}
          {/*<Button title="password" />*/}
          {/*<Button title="options" />*/}
          <span className="lobby-button">share</span>
          <span className="lobby-button">add password</span>
          <span id="lobby-button-option" className="lobby-button" onClick={() => this.props.onClick()}>options</span>
        </div>
      </div>
    );
  }
}

class LobbyOptions extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      prefs: props.prefs
    }
  }

  handleOptionChange(optionKey, choiceIndex) {

    const copy = Object.assign({}, this.state.prefs);
    copy[optionKey] = choiceIndex;
    this.setState({
      prefs: copy,
    })

  }

  render() {

    let options = [];

    // iterating over object
    Object.keys(this.state.prefs).forEach(optionKey => {
      const optionValue = this.state.prefs[optionKey];
      options.push(
        <ListSelect key={optionKey} optionKey={optionKey} optionValue={optionValue} onClick={(optionKey, choiceIndex) => this.handleOptionChange(optionKey, choiceIndex)} />
      );
    });

    return (
      <div id="lobby-options" className={this.props.show ? '' : 'hidden'}>
        {options}
      </div>
    );

  }
}

class ListSelect extends React.Component {
  render() {

    const optionKey = this.props.optionKey;
    const selectedChoice = this.props.optionValue;

    const selectTitle = LOBBY_OPTIONS[optionKey][0];
    const choices = LOBBY_OPTIONS[optionKey].slice(1);

    let optionChoices = [];
    choices.forEach((choice, choiceIndex)=>{
      optionChoices.push(
        <ListSelectOption 
          key={choice} 
          title={choice}
          selected={choiceIndex===selectedChoice}
          onClick={() => this.props.onClick(optionKey, choiceIndex)} />
      );
    });

    return (
      <div className="list-select">
        <span className="list-select-title">{selectTitle}</span>
        <div className="list-select-options">{optionChoices}</div>
      </div>
    );


  }
}

class ListSelectOption extends React.Component {
  render() {
    const title = this.props.title;
    const selected = this.props.selected;
    const className = selected ? 'active' : '';

    return (
      <span className={className} onClick={() => this.props.onClick()}>{title}</span>
    );

  }
}


class PlayerConfig extends React.Component {
  constructor(props) {
    super(props);

    this.shipCatalogue = [0, 1, 2, 3, 4];
    this.catalogueIndex = 0;

    this.state = {
      ship: this.shipCatalogue[this.catalogueIndex],
      // abilities: [3x],
      expanded: false
    }

  }

  refreshShip() {
    this.setState({
      ship: this.shipCatalogue[this.catalogueIndex]
    });
  }

  nextShip() {
    this.catalogueIndex++;
    if(this.catalogueIndex > this.shipCatalogue.length-1) this.catalogueIndex = 0;
    this.refreshShip();
  }

  prevShip() {
    this.catalogueIndex--;
    if(this.catalogueIndex < 0) this.catalogueIndex = this.shipCatalogue.length-1;
    this.refreshShip();
  }

  handleClick(isLeft) {
    isLeft ? this.prevShip() : this.nextShip();
  }

  handleExpansionToggle() {
    this.setState({
      expanded: !this.state.expanded
    });
  }

  render() {
    return (
      <div id="player-config">
        <ShipPicker ship={this.state.ship} onClick={(isLeft) => this.handleClick(isLeft)} />
        <ShipDesc ship={this.state.ship} />
        <ShipStats ship={this.state.ship} expanded={this.state.expanded} />
        <ShipSub ship={this.state.ship} expanded={this.state.expanded} />
        <div id="ability-action-box">
          {/*<AbilityBubbles />*/}
          <div id="ability-action-box-row">
            <span onClick={() => this.handleExpansionToggle()}>{this.state.expanded ? 'less' : 'more'}</span>
            <ActionButton userEngagementPhase={this.props.userEngagementPhase} onClick={} />
          </div>
        </div>
      </div>
    );
  }

}

class ShipPicker extends React.Component {


  render() {
    const i = this.props.ship;
    const typeName = REF.ship.type[i];

    return (
      <div id="ship-picker">
        <span
          id="ship-picker-left"
          className="ship-picker-arrow"
          onClick={() => this.props.onClick(true)}>&lt;</span>
        <span id="ship-picker-text"
              onClick={() => this.props.onClick(false)}>{typeName.toUpperCase()}</span>
        <span
          id="ship-picker-right"
          className="ship-picker-arrow"
          onClick={() => this.props.onClick(false)}>&gt;</span>
      </div>
    );
  }
}

class ShipDesc extends React.Component {

  render() {
    const i = this.props.ship;
    const typeName = REF.ship.type[i];
    const imagePath = IMAGES.ship[i];
    const typeDesc = REF.ship.typeDesc[i];
    
    return (
      <div id="ship-desc">
        <div id="ship-desc-image">
          <div id="ship-desc-image-background"></div>
          <img src={imagePath} alt={typeName + ' ship image'} id="ship-desc-image-mask"/>
        </div>
        <span id="ship-desc-text">{typeDesc}</span>
      </div>
    );
  }
}

class ShipStats extends React.Component {

  render() {

    const className = this.props.expanded ? '' : 'collapsed';

    let rows = [];
    for(let metric of REF.ship.stats) {
      const title = metric[0];
      const value = metric.slice(1)[this.props.ship];
      rows.push(<ShipStatsRow key={title} title={title} value={value} />);
    }

    return (
      <div id="ship-stats" className={className}>
        {rows}
      </div>
    );
  }
}

class ShipStatsRow extends React.Component {

  render() {
    return (
      <div className="ship-stats-row">
        <span className="ship-stats-row-label">{this.props.title}</span>
        <span className="ship-stats-bar">
          <span className={'ship-stats-bar-value-' + this.props.value*10}></span>
        </span>
      </div>
    );
  }
}


class ShipSub extends React.Component {
  render() {

    const className = this.props.expanded ? '' : 'collapsed';

    const i = this.props.ship;
    const subName = REF.ship.sub[i];
    const imagePath = IMAGES.shipSub[i];

    return (
      <div id="ship-sub" className={className}>
        <span id="ship-sub-label">SUB</span>
        <div id="ship-sub-image">
          <div id="ship-sub-image-background"></div>
          <img src={imagePath} alt={subName + ' ship sub image'} id="ship-sub-image-mask"/>
        </div>
        <span id="ship-sub-title">{subName}</span>
      </div>
    );
  }
}

class ActionButton extends React.Component {

  render() {
    const buttonTitle = ['CONNECT', 'START', 'waiting...', 'LOBBY FULL'][this.props.userEngagementPhase];
    const className = this.props.userEngagementPhase===3 ? 'disabled' : '';
    return (
      <button className={className}>{buttonTitle}</button>
    );
  }
}


class LobbyUsers extends React.Component {

  render() {
    const players = this.props.users.players;
    const spectators = this.props.users.spectators;
    const limit = this.props.playerLimit;

    return (
      <div id="lobby-users">
        <PlayersTable users={players} limit={limit}/>
        <SpectatorsTable users={spectators}/>
      </div>
    );
  }
}

class PlayersTable extends React.Component {

  render() {

    let rows = [];
    let index = 0;
    for(let [name, rank, team, ready] of this.props.users) {

      ready = ready ? '✓' : '';
      let sign = (rank % 100 <= 30 ? '-' : (rank % 100 >= 70 ? '+' : ''));
      rank = `${User.calculateRankLetter(rank) + sign}`;
      team = team || 'SOLO';
      rows.push(
        <tr key={name+rank}>
          <td>{++index + '.'}</td>
          <td>{ready}</td>
          <td>{name}</td>
          <td>{rank}</td>
          <td>{team}</td>
        </tr>
      )
    }
    for(let i = 0; i < this.props.limit - this.props.users.length; i++) {
      rows.push(
        <tr key={++index} className="empty-row">
          <td></td>
          <td></td>
          <td>{'empty'}</td>
          <td></td>
          <td></td>
        </tr>
      )
    }

    return (
      <table id="players-table" className="users-table">
        <thead>
          <tr>
            <th></th>
            <th></th>
            <th>PLAYERS</th>
            <th>RANK</th>
            <th>TEAM</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    );
  }
}

class SpectatorsTable extends React.Component {

  render() {

    let rows = [];
    let index = 0;
    for(let name of this.props.users) {
      index++;
      rows.push(
        <tr key={name+index}>
          <td>{name}</td>
        </tr>
      )
    }

    return (
      <table id="spectators-table" className="users-table">
        <thead>
        <tr>
          <th>SPECTATING ({index})</th>
        </tr>
        </thead>
        <tbody>
        {rows}
        </tbody>
      </table>
    );
  }
}


/*class ProductCategoryRow extends React.Component {
  render() {
    return <tr><th colSpan="2">{this.props.category}</th></tr>;
  }
}

class ProductRow extends React.Component {
  render() {
    var name = this.props.product.stocked ?
      this.props.product.name :
      <span style={{color: 'red'}}>
        {this.props.product.name}
      </span>;
    return (
      <tr>
        <td>{name}</td>
        <td>{this.props.product.price}</td>
      </tr>
    );
  }
}

class ProductTable extends React.Component {
  render() {
    var rows = [];
    var lastCategory = null;
    this.props.products.forEach(function(product) {
      if (product.category !== lastCategory) {
        rows.push(<ProductCategoryRow category={product.category} key={product.category} />);
      }
      rows.push(<ProductRow product={product} key={product.name} />);
      lastCategory = product.category;
    });
    return (
      <table>
        <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
        </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

class SearchBar extends React.Component {
  render() {
    return (
      <form>
        <input type="text" placeholder="Search..." />
        <p>
          <input type="checkbox" />
          {' '}
          Only show products in stock
        </p>
      </form>
    );
  }
}

class FilterableProductTable extends React.Component {
  render() {
    return (
      <div>
        <SearchBar />
        <ProductTable products={this.props.products} />
      </div>
    );
  }
}*/


// var PRODUCTS = [
//   {category: 'Sporting Goods', price: '$49.99', stocked: true, name: 'Football'},
//   {category: 'Sporting Goods', price: '$9.99', stocked: true, name: 'Baseball'},
//   {category: 'Sporting Goods', price: '$29.99', stocked: false, name: 'Basketball'},
//   {category: 'Electronics', price: '$99.99', stocked: true, name: 'iPod Touch'},
//   {category: 'Electronics', price: '$399.99', stocked: false, name: 'iPhone 5'},
//   {category: 'Electronics', price: '$199.99', stocked: true, name: 'Nexus 7'}
// ];

let INFO = {
  type: 1,
  code: 'Hkd3M-',
  password: null,
  game_settings: {
    map: 2,
    mode: 0,
    stock: 3,
    player_capacity: 6,
  },
  users: {
    players: [
      // {name, rank, team, ready, ship, slots []}

      ['Billy', 302, 1, true, 2],
      ['twenty-one p', 380, 1, false, 1],
      ['user1902', 340, 0, true, 1],

    ],
    spectators: [
      'markees',
      'facemace'
    ]
  }
};

const LOBBY_OPTIONS = {
  map: ['MAP', 'alpha map', 'beta map', 'gamma map'],
  mode: ['GAME MODE', 'Capture the Flag', 'Territorial', 'Survival'],
  player_capacity: ['MAX PLAYERS', '2', '3', '4', '5', '6', '7', '8'],
  stock: ['STOCK', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
};

const REF = {
  lobby: {
    type: ['public', 'private', 'practice'],
    typeDesc: [
      'This is a public lobby. Players present have complete control over game settings',
      'This is a private lobby. Players present have complete control over game settings',
      'This is a practice lobby. Players present have complete control over game settings',
    ]
  },

  ship: {
    type: ['standard', 'rate', 'speed', 'defense', 'damage'],
    typeDesc: [
      'a tune with the world and itself, this is the balanced ship',
      'this ship produces a stream of light bullets to trap and confuse',
      'run your way out of any situation with the speed ship',
      'take more than just a hit with the defense ship',
      'this ship is feared across the reach of space, use it wisely'
    ],
    sub: ['attractor', 'heat seeker', 'repulsors', 'stealth', 'block bomb'],
    stats: [
      ['HEALTH', '0.6', '0.6', '0.2', '1.0', '0.7'],
      ['SPEED', '0.6', '0.6', '0.9', '0.4', '0.4'],
      ['ATTACK', '0.5', '0.4', '0.3', '0.5', '1.0'],
      ['RANGE', '0.5', '0.5', '0.3', '0.7', '0.4'],
    ]

  }

};

const IMAGES = {
  ship: [
    'images/menu-ship-standard.png',
    'images/menu-ship-rate.png',
    'images/menu-ship-speed.png',
    'images/menu-ship-defense.png',
    'images/menu-ship-damage.png',
  ],
  shipSub: [
    'images/menu-ship-sub-standard.png',
    'images/menu-ship-sub-rate.png',
    'images/menu-ship-sub-speed.png',
    'images/menu-ship-sub-defense.png',
    'images/menu-ship-sub-damage.png',
  ]
};

// ReactDOM.render(
//   <DSGameLobby data={INFO} />,
//   document.getElementById('container')
// );




