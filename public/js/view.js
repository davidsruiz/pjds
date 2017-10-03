
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

  colors: [null, null],
  angle: 0,

  angleOffset: 0,

  shuffle() {
    let [c1, c2] = TINT.assortment.sample(), deg = Math.randomIntMinMax(15, 75);
    TINT.load(deg, c1, c2);
  },

  load(deg, c1, c2) {
    this.angle = deg;
    this.colors[0] = c1;
    this.colors[1] = c2;
    this.refresh()
  },

  setAngleOffset(deg) {
    this.angleOffset = deg;
    this.refresh()
  },

  refresh() {
    let elem = document.querySelector('#tint');
    if (elem) $(elem).css('background', `linear-gradient(${this.angle + this.angleOffset}deg, ${this.colors[0]}, ${this.colors[1]})`);
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
      // userEngagementPhase:  0,
      lobbyOptionsShown: false,
    }
  }

  lobbyOptionsToggle() {
    this.setState({
      lobbyOptionsShown: !this.state.lobbyOptionsShown
    })
  }

  render() {
    const data = this.props.lobbySummary;
    const full = data.users.players.length >= data.game_settings.noneditableSettings.maxPlayers;
    const ongoing = data.ongoing;
    const isPublic = data.type === 0;

    return (
      <div id="ds-game-lobby">
        <div id="part-1">
          <IconBar />
          <span id="logo-type">DEEP SPACE</span>
          <LobbyType type={data.type} rotation={data.rotation} nextChange={data.nextChange} />
          <LobbyActions code={data.code} password={data.password} onOptionsClick={() => this.lobbyOptionsToggle()} isPublic={isPublic} />
          <LobbyOptions type={data.type} prefs={data.game_settings.editableSettings} show={this.state.lobbyOptionsShown} />
        </div>
        <div id="part-2">
          <PlayerConfig joined={this.props.joined} ready={this.props.ready} full={full} ongoing={ongoing} />
          <LobbyUsers users={data.users} playerLimit={data.game_settings.noneditableSettings.maxPlayers}/>
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
    
    const homeAction = () => window.location.reset();
    
    return (
      <div id="icon-bar">
        <IconButton iconName="home" onClick={() => homeAction()}/>
        {/*<IconButton iconName="volume_up" />*/}
        {/*<IconButton iconName="help" />*/}
        {/*<IconButton iconName="settings" />*/}
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

class LobbyType extends React.Component {
  render() {

    const name = (REF.lobby.type[this.props.type] + ' lobby').toUpperCase();

    let desc = 'no description';
    switch(this.props.type) {

      // public matches (deal with rotation info)
      case 0:

        let {mode, map} = this.props.rotation;
        mode = REF.lobby.options.mode[mode];
        map = REF.lobby.options.map[map];

        const nextChangeDate = new Date(this.props.nextChange);
        let hour = nextChangeDate.getHours();
        const timeOfDay = (hour > 11) ? 'PM' : 'AM';
        if(hour > 11) hour -= 12;
        if(hour == 0) hour = 12;
        let minutes = nextChangeDate.getMinutes();
        if(minutes < 10) minutes = '0' + minutes;
        const timeString = `${hour} ${timeOfDay}`;

        desc = REF.lobby.typeDesc[this.props.type](map, mode, timeString);

        break;

      // everything else
      default:

        desc = REF.lobby.typeDesc[this.props.type];

        break;

    }

    return (
      <div id="lobby-type">
        <span id="lobby-type-name">{name}</span>
        <span id="lobby-type-desc">{desc}</span>
      </div>
    );

  }
}

class LobbyActions extends React.Component {

  handlePasswordClick() {

    this.props.password ? ENV.lobby.clearPassword() : ENV.lobby.setPassword()

  }
  
  handleShareClick() {

    window.prompt(`copy to share this link:`, window.location.href)

  }

  render() {
    const code = this.props.code;
    
    const passwordMessage = this.props.password ? 'clear password' : 'add password';

    const passwordButtonClass = `lobby-button ${this.props.isPublic ? 'hidden' : ''}`;
    const optionButtonClass = `lobby-button ${this.props.isPublic ? 'hidden' : ''}`;

    return (
      <div id="lobby-action">
        <span id="lobby-id">{code.toUpperCase()}</span>
        <div id="lobby-action-buttons">
          {/*<Button title="share" />*/}
          {/*<Button title="password" />*/}
          {/*<Button title="options" />*/}
          <span className="lobby-button" onClick={() => this.handleShareClick()}>share</span>
          <span className={passwordButtonClass} onClick={() => this.handlePasswordClick()} hidden={this.props.isPublic}>{passwordMessage}</span>
          <span id="lobby-button-option" className={optionButtonClass} onClick={() => this.props.onOptionsClick()}>options</span>
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

    // tell server
    ENV.lobby.updateOptions(optionKey, choiceIndex);

  }

  render() {

    let options = [];

    // iterating over object
    Object.keys(this.state.prefs).forEach(optionKey => {
      const optionValue = this.state.prefs[optionKey];
      options.push(
        <ListSelect key={optionKey} optionKey={optionKey} optionValue={optionValue} type={this.props.type} onClick={(optionKey, choiceIndex) => this.handleOptionChange(optionKey, choiceIndex)} />
      );
    });

    const hidden = (options.length === 0);
    const collapsed = !this.props.show;

    return (
      <div id="lobby-options" className={(collapsed ? 'collapsed' : '') +' '+ (hidden ? 'hidden' : '')}>
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
    const choiceIndexes = LOBBY_OPTIONS[optionKey].slice(1)[this.props.type];
    // const choices = LOBBY_OPTIONS[optionKey].slice(1);

    let optionChoices = [];
    choiceIndexes.forEach((choiceIndex)=>{
      optionChoices.push(
        <ListSelectOption 
          key={choiceIndex}
          title={REF.lobby.options[optionKey][choiceIndex]}
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
    if(this.props.ready) return;
    isLeft ? this.prevShip() : this.nextShip();
  }

  handleExpansionToggle() {
    this.setState({
      expanded: !this.state.expanded
    });
  }

  handleActionClick() {
    ENV.lobby.start(this.state.ship);
  }

  render() {
    let playerConfigClass = ( this.props.joined ? ( this.props.ready ? 'disabled' : '' ) : 'hidden' ) ;
    let shadeClass = ( this.props.joined ? ( this.props.ready ? 'opacity-5' : 'opacity-0' ) : 'opacity-10' ) ;

    return (
      <div id="player-config" className={playerConfigClass}>
        <div id="player-config-shade" className={shadeClass}></div>
        <ShipPicker ship={this.state.ship} onClick={(isLeft) => this.handleClick(isLeft)} />
        <ShipDesc ship={this.state.ship} />
        <ShipStats ship={this.state.ship} expanded={this.state.expanded} />
        <ShipSub ship={this.state.ship} expanded={this.state.expanded} />
        <div id="ability-action-box">
          {/*<AbilityBubbles />*/}
          <div id="ability-action-box-row">
            <span onClick={() => this.handleExpansionToggle()}>{this.state.expanded ? 'less' : 'more'}</span>
            <ActionButton
              joined={this.props.joined}
              ready={this.props.ready}
              full={this.props.full}
              ongoing={this.props.ongoing}
              onClick={() => this.handleActionClick() } />
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
          <img src={imagePath} alt={typeName + ' ship image'} id="ship-desc-image-mask" draggable="false"/>
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
          <img src={imagePath} alt={subName + ' ship sub image'} id="ship-sub-image-mask" draggable="false"/>
        </div>
        <span id="ship-sub-title">{subName}</span>
      </div>
    );
  }
}

class ActionButton extends React.Component {

  render() {

    let buttonTitle;
    let className = '';
    let actionBlock = () => {};
    if(this.props.ongoing) {
      buttonTitle = 'IN PROGRESS';
      className = 'hollow';
    } else {
      if(this.props.joined) {
        if(this.props.ready) {
          buttonTitle = 'waiting...';
          className = 'disabled';
        } else {
          buttonTitle = 'START';
          actionBlock = () => { this.props.onClick(); }
        }
      } else {
        if(this.props.full) {
          buttonTitle = 'LOBBY FULL';
          className = 'hollow';
        } else {
          buttonTitle = 'JOIN';
          actionBlock = () => { ENV.lobby.join() }
        }
      }
    }

    // if(this.props.joined) {
    //   if(this.props.ready) {
    //     buttonTitle = 'waiting...';
    //     className = 'disabled';
    //   } else {
    //     buttonTitle = 'START';
    //     actionBlock = () => { this.props.onClick(); }
    //   }
    // } else {
    //   if(this.props.ongoing) {
    //     buttonTitle = 'IN PROGRESS';
    //     className = 'hollow';
    //   } else {
    //     if(this.props.full) {
    //       buttonTitle = 'LOBBY FULL';
    //       className = 'hollow';
    //     } else {
    //       buttonTitle = 'CONNECT';
    //       actionBlock = () => { ENV.lobby.join() }
    //     }
    //   }
    // }


    return (
      <button className={className} onClick={() => actionBlock()}>{buttonTitle}</button>
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
    for(let [id, name, rank, team, ready] of this.props.users) {

      let highlight = ENV.user.id === id ? 'highlight' : '';
      ready = ready ? '✓' : '';
      let sign = (rank % 100 <= 30 ? '-' : (rank % 100 >= 70 ? '+' : ''));
      let rankSymbol = `${User.calculateRankLetter(rank) + sign}`;
      team = team || 'SOLO';
      rows.push(
        <tr key={name+rank} className={highlight}>
          <td>{++index + '.'}</td>
          <td>{ready}</td>
          <td>{name}</td>
          <td>{rankSymbol}</td>
          <td>{team}</td>
        </tr>
      )
    }
    let left = this.props.limit - this.props.users.length;
    const over = left > 3;
    if(over) left = 3;
    for(let i = 0; i < left; i++) {
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
    if(over) {
      rows.push(
        <tr key={++index} className="empty-row">
          <td></td>
          <td></td>
          <td>{'...'}</td>
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
  map: ['MAP', [], [0], [0, 1, 2, 3]],
  mode: ['GAME MODE', [], [0, 1], [0, 1]],
  player_capacity: ['MAX PLAYERS', '2', '3', '4', '5', '6', '7', '8'],
  stock: ['STOCK', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
};

const REF = {
  lobby: {
    type: ['public', 'private', 'practice'],
    typeDesc: [
      (maps, mode, time) => <span>Match up against players with similar skill. The current rotation is <b>{maps}</b> until <b>{time}</b>. The mode is <b>{mode}</b>.</span>,
      <span><b>Share</b> a link to this lobby to invite friends in a <b>private</b> match. All players present have control over game settings.</span>,
      <span>Test the <b>stages</b>, <b>ships</b>, and <b>modes</b> in a private environment you control.</span>,
    ],
    options: {
      map: ['Wide Sky', 'Nautical', 'Nebula', 'Clockwise'],
      mode: ['Capture the Flag', 'Territorial', 'Survival'],
      player_capacity: ['2', '3', '4', '5', '6', '7', '8'],
      stock: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    }
  },

  ship: {
    type: ['standard', 'rate', 'speed', 'defense', 'damage'],
    typeDesc: [
      'a classic ship fit for all occasions',
      'traps and confuses with a stream of light bullets',
      'run your way out of any situation with the speed ship',
      'takes more than just a hit',
      'feared across the reach of space, use it wisely'
    ],
    sub: ['attractor', 'heat seeker', 'repulsors', 'stealth', 'block bomb'],
    stats: [
      ['HEALTH' , '0.6', '0.6', '0.2', '1.0', '0.7'],
      ['SPEED'  , '0.6', '0.6', '0.9', '0.4', '0.4'],
      ['ATTACK' , '0.5', '0.4', '0.3', '0.5', '1.0'],
      ['RANGE'  , '0.5', '0.5', '0.3', '0.7', '0.4'],
    ]

  },

  results: {
    modeMeasure: ['distance', 'amount covered', 'time lasted']
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




