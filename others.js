var game_core = function(game_instance){

        //Store the instance, if any
    this.instance = game_instance;
        //Store a flag if we are the server
    this.server = this.instance !== undefined;

        //Used in collision etc.
    this.world = {
        width : 720,
        height : 480
    };

        //We create a player set, passing them
        //the game that is running them, as well
    if(this.server) {

        this.players = {
            self : new game_player(this,this.instance.player_host),
            other : new game_player(this,this.instance.player_client)
        };

       this.players.self.pos = {x:20,y:20};

    } else {

        this.players = {
            self : new game_player(this),
            other : new game_player(this)
        };

            //Debugging ghosts, to help visualise things
        this.ghosts = {
                //Our ghost position on the server
            server_pos_self : new game_player(this),
                //The other players server position as we receive it
            server_pos_other : new game_player(this),
                //The other players ghost destination position (the lerp)
            pos_other : new game_player(this)
        };

        this.ghosts.pos_other.state = 'dest_pos';

        this.ghosts.pos_other.info_color = 'rgba(255,255,255,0.1)';

        this.ghosts.server_pos_self.info_color = 'rgba(255,255,255,0.2)';
        this.ghosts.server_pos_other.info_color = 'rgba(255,255,255,0.2)';

        this.ghosts.server_pos_self.state = 'server_pos';
        this.ghosts.server_pos_other.state = 'server_pos';

        this.ghosts.server_pos_self.pos = { x:20, y:20 };
        this.ghosts.pos_other.pos = { x:500, y:200 };
        this.ghosts.server_pos_other.pos = { x:500, y:200 };
    }

        //The speed at which the clients move.
    this.playerspeed = 120;

        //Set up some physics integration values
    this._pdt = 0.0001;                 //The physics update delta time
    this._pdte = new Date().getTime();  //The physics update last delta time
        //A local timer for precision on server and client
    this.local_time = 0.016;            //The local timer
    this._dt = new Date().getTime();    //The local timer delta
    this._dte = new Date().getTime();   //The local timer last frame time

        //Start a physics loop, this is separate to the rendering
        //as this happens at a fixed frequency
    this.create_physics_simulation();

        //Start a fast paced timer for measuring time easier
    this.create_timer();

        //Client specific initialisation
    if(!this.server) {

            //Create a keyboard handler
        this.keyboard = new THREEx.KeyboardState();

            //Create the default configuration settings
        this.client_create_configuration();

            //A list of recent server updates we interpolate across
            //This is the buffer that is the driving factor for our networking
        this.server_updates = [];

            //Connect to the socket.io server!
        this.client_connect_to_server();

            //We start pinging the server to determine latency
        this.client_create_ping_timer();

            //Set their colors from the storage or locally
        this.color = localStorage.getItem('color') || '#cc8822' ;
        localStorage.setItem('color', this.color);
        this.players.self.color = this.color;

            //Make this only if requested
        if(String(window.location).indexOf('debug') != -1) {
            this.client_create_debug_gui();
        }

    } else { //if !server

        this.server_time = 0;
        this.laststate = {};

    }

}; //game_co
