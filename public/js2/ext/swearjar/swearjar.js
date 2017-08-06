"use strict";

// swearjar-node
// var path = require('path');
var swearjar = {

  _badWords: {},

  scan: function scan(text, callback) {
    var word, key, match;
    var regex = /\w+/g;

    while (match = regex.exec(text)) {
      word = match[0];
      key = word.toLowerCase();

      if (key in this._badWords && Array.isArray(this._badWords[key])) {
        if (callback(word, match.index, this._badWords[key]) === false) {
          break;
        }
      }
    }
  },

  profane: function profane(text) {
    var profane = false;

    this.scan(text, function (word, index, categories) {
      profane = true;
      return false; // Stop on first match
    });

    return profane;
  },

  scorecard: function scorecard(text) {
    var scorecard = {};

    this.scan(text, function (word, index, categories) {
      for (var i = 0; i < categories.length; i += 1) {
        var cat = categories[i];

        if (cat in scorecard) {
          scorecard[cat] += 1;
        } else {
          scorecard[cat] = 1;
        }
      };
    });

    return scorecard;
  },

  censor: function censor(text) {
    var censored = text;

    this.scan(text, function (word, index, categories) {
      censored = censored.substr(0, index) + word.replace(/\S/g, '*') + censored.substr(index + word.length);
    });

    return censored;
  },

  loadBadWords: function loadBadWords(relativePath) {
    var basePath = path.dirname(module.parent.filename);
    var fullPath = path.join(basePath, relativePath);
    this._badWords = require(fullPath);
  },

  setBadWords: function setBadWords(badWords) {
    this._badWords = badWords || {};
  }
};

// swearjar._badWords = require("./config/en_US.json");
swearjar._badWords = {
  "anus": ["sexual"],
  "arse": ["insult"],
  "arsehole": ["insult"],
  "ass": ["sexual", "insult"],
  "ass-hat": ["insult"],
  "ass-pirate": ["discriminatory"],
  "assbag": ["insult"],
  "assbandit": ["discriminatory"],
  "assbanger": ["discriminatory"],
  "assbite": ["insult"],
  "assclown": ["sexual"],
  "asscock": ["insult"],
  "asscracker": ["sexual"],
  "assface": ["sexual"],
  "assfuck": ["sexual"],
  "assfucker": ["discriminatory"],
  "assgoblin": ["discriminatory"],
  "asshat": ["sexual"],
  "asshead": ["insult"],
  "asshole": ["insult"],
  "asshopper": ["discriminatory"],
  "assjacker": ["discriminatory"],
  "asslick": ["insult"],
  "asslicker": ["insult"],
  "assmonkey": ["insult"],
  "assmunch": ["insult"],
  "assmuncher": ["sexual"],
  "assnigger": ["discriminatory"],
  "asspirate": ["discriminatory"],
  "assshit": ["insult"],
  "assshole": ["sexual"],
  "asssucker": ["insult"],
  "asswad": ["sexual"],
  "asswipe": ["sexual"],
  "bampot": ["insult"],
  "bastard": ["insult"],
  "beaner": ["discriminatory"],
  "beastial": ["sexual"],
  "beastiality": ["sexual"],
  "beastility": ["sexual"],
  "bestial": ["sexual"],
  "bestiality": ["sexual"],
  "bitch": ["insult"],
  "bitchass": ["insult"],
  "bitcher": ["insult"],
  "bitchin": ["inappropriate"],
  "bitching": ["inappropriate"],
  "bitchtit": ["discriminatory"],
  "bitchy": ["insult"],
  "blow job": ["sexual"],
  "blowjob": ["sexual"],
  "bollocks": ["sexual"],
  "bollox": ["sexual"],
  "boner": ["sexual"],
  "bullshit": ["inappropriate"],
  "butt plug": ["sexual"],
  "camel toe": ["sexual"],
  "choad": ["sexual"],
  "chode": ["sexual"],
  "clit": ["sexual"],
  "clitface": ["insult"],
  "clitfuck": ["sexual"],
  "clusterfuck": ["inappropriate"],
  "cock": ["sexual"],
  "cockbite": ["insult"],
  "cockburger": ["insult"],
  "cockface": ["insult"],
  "cockfucker": ["insult"],
  "cockhead": ["insult"],
  "cockmonkey": ["insult"],
  "cocknose": ["insult"],
  "cocknugget": ["insult"],
  "cockshit": ["insult"],
  "cocksuck": ["sexual"],
  "cocksucked": ["sexual"],
  "cocksucker": ["discriminatory", "sexual"],
  "cocksucking": ["sexual", "discriminatory"],
  "cocksucks": ["sexual", "discriminatory"],
  "coochie": ["sexual"],
  "coochy": ["sexual"],
  "cooter": ["sexual"],
  "cum": ["sexual"],
  "cumbubble": ["insult"],
  "cumdumpster": ["sexual"],
  "cummer": ["sexual"],
  "cumming": ["sexual"],
  "cumshot": ["sexual"],
  "cumslut": ["sexual", "insult"],
  "cumtart": ["insult"],
  "cunillingus": ["sexual"],
  "cunnie": ["sexual"],
  "cunnilingus": ["sexual"],
  "cunt": ["insult", "sexual"],
  "cuntface": ["insult"],
  "cunthole": ["sexual"],
  "cuntlick": ["sexual"],
  "cuntlicker": ["sexual", "discriminatory"],
  "cuntlicking": ["sexual"],
  "cuntrag": ["insult"],
  "cuntslut": ["insult"],
  "cyberfuc": ["sexual"],
  "cyberfuck": ["sexual"],
  "cyberfucked": ["sexual"],
  "cyberfucker": ["sexual"],
  "cyberfucking": ["sexual"],
  "dago": ["discriminatory"],
  "damn": ["inappropriate"],
  "deggo": ["discriminatory"],
  "dick": ["sexual", "insult"],
  "dickbag": ["insult"],
  "dickbeaters": ["sexual"],
  "dickface": ["insult"],
  "dickfuck": ["insult"],
  "dickhead": ["insult"],
  "dickhole": ["sexual"],
  "dickjuice": ["sexual"],
  "dickmilk": ["sexual"],
  "dickslap": ["sexual"],
  "dickwad": ["insult"],
  "dickweasel": ["insult"],
  "dickweed": ["insult"],
  "dickwod": ["insult"],
  "dildo": ["sexual"],
  "dink": ["insult", "sexual"],
  "dipshit": ["insult"],
  "doochbag": ["insult"],
  "dookie": ["inappropriate"],
  "douche": ["insult"],
  "douche-fag": ["insult"],
  "douchebag": ["insult"],
  "douchewaffle": ["discriminatory"],
  "dumass": ["insult"],
  "dumb ass": ["insult"],
  "dumbass": ["insult"],
  "dumbfuck": ["insult"],
  "dumbshit": ["insult"],
  "dumshit": ["insult"],
  "ejaculate": ["sexual"],
  "ejaculated": ["sexual"],
  "ejaculates": ["sexual"],
  "ejaculating": ["sexual"],
  "ejaculation": ["sexual"],
  "fag": ["discriminatory"],
  "fagbag": ["discriminatory"],
  "fagfucker": ["discriminatory"],
  "fagging": ["discriminatory"],
  "faggit": ["discriminatory"],
  "faggot": ["discriminatory"],
  "faggotcock": ["discriminatory"],
  "faggs": ["discriminatory"],
  "fagot": ["discriminatory"],
  "fags": ["discriminatory"],
  "fagtard": ["discriminatory"],
  "fart": ["inappropriate"],
  "farted": ["inappropriate"],
  "farting": ["inappropriate"],
  "farty": ["inappropriate"],
  "fatass": ["insult"],
  "felatio": ["sexual"],
  "fellatio": ["sexual"],
  "feltch": ["sexual"],
  "fingerfuck": ["sexual"],
  "fingerfucked": ["sexual"],
  "fingerfucker": ["sexual"],
  "fingerfucking": ["sexual"],
  "fingerfucks": ["sexual"],
  "fistfuck": ["sexual"],
  "fistfucked": ["sexual"],
  "fistfucker": ["sexual"],
  "fistfucking": ["sexual"],
  "flamer": ["discriminatory"],
  "fuck": ["sexual"],
  "fuckass": ["insult"],
  "fuckbag": ["insult"],
  "fuckboy": ["insult"],
  "fuckbrain": ["insult"],
  "fuckbutt": ["sexual"],
  "fucked": ["sexual"],
  "fucker": ["sexual", "insult"],
  "fuckersucker": ["insult"],
  "fuckface": ["insult"],
  "fuckhead": ["sexual"],
  "fuckhole": ["insult"],
  "fuckin": ["sexual"],
  "fucking": ["sexual"],
  "fuckme": ["sexual"],
  "fucknut": ["insult"],
  "fucknutt": ["insult"],
  "fuckoff": ["insult"],
  "fuckstick": ["sexual"],
  "fucktard": ["insult"],
  "fuckup": ["insult"],
  "fuckwad": ["insult"],
  "fuckwit": ["insult"],
  "fuckwitt": ["insult"],
  "fudgepacker": ["discriminatory"],
  "fuk": ["sexual"],
  "gangbang": ["sexual"],
  "gangbanged": ["sexual"],
  "goddamn": ["inappropriate", "blasphemy"],
  "goddamnit": ["inappropriate", "blasphemy"],
  "gooch": ["sexual"],
  "gook": ["discriminatory"],
  "gringo": ["discriminatory"],
  "guido": ["discriminatory"],
  "handjob": ["sexual"],
  "hardcoresex": ["sexual"],
  "heeb": ["discriminatory"],
  "hell": ["inappropriate"],
  "ho": ["discriminatory"],
  "hoe": ["discriminatory"],
  "homo": ["discriminatory"],
  "homodumbshit": ["insult"],
  "honkey": ["discriminatory"],
  "horniest": ["sexual"],
  "horny": ["sexual"],
  "hotsex": ["sexual"],
  "humping": ["sexual"],
  "jackass": ["insult"],
  "jap": ["discriminatory"],
  "jigaboo": ["discriminatory"],
  "jism": ["sexual"],
  "jiz": ["sexual"],
  "jizm": ["sexual"],
  "jizz": ["sexual"],
  "jungle bunny": ["discriminatory"],
  "junglebunny": ["discriminatory"],
  "kike": ["discriminatory"],
  "kock": ["sexual"],
  "kondum": ["sexual"],
  "kooch": ["sexual"],
  "kootch": ["sexual"],
  "kum": ["sexual"],
  "kumer": ["sexual"],
  "kummer": ["sexual"],
  "kumming": ["sexual"],
  "kums": ["sexual"],
  "kunilingus": ["sexual"],
  "kunt": ["sexual"],
  "kyke": ["discriminatory"],
  "lezzie": ["discriminatory"],
  "lust": ["sexual"],
  "lusting": ["sexual"],
  "mcfagget": ["discriminatory"],
  "mick": ["discriminatory"],
  "minge": ["sexual"],
  "mothafuck": ["sexual"],
  "mothafucka": ["sexual", "insult"],
  "mothafuckaz": ["sexual"],
  "mothafucked": ["sexual"],
  "mothafucker": ["sexual", "insult"],
  "mothafuckin": ["sexual"],
  "mothafucking": ["sexual"],
  "mothafucks": ["sexual"],
  "motherfuck": ["sexual"],
  "motherfucked": ["sexual"],
  "motherfucker": ["sexual", "insult"],
  "motherfuckin": ["sexual"],
  "motherfucking": ["sexual"],
  "muff": ["sexual"],
  "muffdiver": ["discriminatory", "sexual"],
  "munging": ["sexual"],
  "negro": ["discriminatory"],
  "nigga": ["discriminatory"],
  "nigger": ["discriminatory"],
  "niglet": ["discriminatory"],
  "nut sack": ["sexual"],
  "nutsack": ["sexual"],
  "orgasim": ["sexual"],
  "orgasm": ["sexual"],
  "paki": ["discriminatory"],
  "panooch": ["sexual"],
  "pecker": ["sexual"],
  "peckerhead": ["insult"],
  "penis": ["sexual"],
  "penisfucker": ["discriminatory"],
  "penispuffer": ["discriminatory"],
  "phonesex": ["sexual"],
  "phuk": ["sexual"],
  "phuked": ["sexual"],
  "phuking": ["sexual"],
  "phukked": ["sexual"],
  "phukking": ["sexual"],
  "phuks": ["sexual"],
  "phuq": ["sexual"],
  "pis": ["sexual"],
  "pises": ["sexual"],
  "pisin": ["sexual"],
  "pising": ["sexual"],
  "pisof": ["sexual"],
  "piss": ["inappropriate"],
  "pissed": ["inappropriate"],
  "pisser": ["sexual"],
  "pisses": ["sexual"],
  "pissflaps": ["sexual"],
  "pissin": ["sexual"],
  "pissing": ["sexual"],
  "pissoff": ["sexual"],
  "polesmoker": ["discriminatory"],
  "pollock": ["discriminatory"],
  "poon": ["sexual"],
  "poonani": ["sexual"],
  "poonany": ["sexual"],
  "poontang": ["sexual"],
  "porch monkey": ["discriminatory"],
  "porchmonkey": ["discriminatory"],
  "porn": ["sexual"],
  "porno": ["sexual"],
  "pornography": ["sexual"],
  "pornos": ["sexual"],
  "prick": ["sexual"],
  "punanny": ["sexual"],
  "punta": ["insult"],
  "pusies": ["sexual", "insult"],
  "pussies": ["sexual", "insult"],
  "pussy": ["sexual", "insult"],
  "pussylicking": ["sexual"],
  "pusy": ["sexual"],
  "puto": ["insult"],
  "renob": ["sexual"],
  "rimjob": ["sexual"],
  "ruski": ["discriminatory"],
  "sandnigger": ["discriminatory"],
  "schlong": ["sexual"],
  "scrote": ["sexual"],
  "shit": ["sexual", "inappropriate"],
  "shitass": ["insult"],
  "shitbag": ["insult"],
  "shitbagger": ["insult"],
  "shitbrain": ["insult"],
  "shitbreath": ["insult"],
  "shitcunt": ["insult"],
  "shitdick": ["insult"],
  "shited": ["sexual"],
  "shitface": ["insult"],
  "shitfaced": ["inappropriate", "insult"],
  "shitfull": ["sexual"],
  "shithead": ["insult"],
  "shithole": ["insult"],
  "shithouse": ["inappropriate"],
  "shiting": ["sexual"],
  "shitspitter": ["sexual"],
  "shitstain": ["inappropriate", "insult"],
  "shitted": ["sexual"],
  "shitter": ["sexual"],
  "shittiest": ["inappropriate"],
  "shitting": ["inappropriate"],
  "shitty": ["inappropriate"],
  "shity": ["sexual"],
  "shiz": ["inappropriate"],
  "shiznit": ["inappropriate"],
  "skank": ["insult"],
  "skeet": ["sexual"],
  "skullfuck": ["sexual"],
  "slut": ["discriminatory"],
  "slutbag": ["discriminatory"],
  "sluts": ["sexual"],
  "smeg": ["inappropriate"],
  "smut": ["sexual"],
  "snatch": ["sexual"],
  "spic": ["discriminatory"],
  "spick": ["discriminatory"],
  "splooge": ["sexual"],
  "spunk": ["sexual"],
  "tard": ["discriminatory"],
  "testicle": ["sexual"],
  "thundercunt": ["insult"],
  "tit": ["sexual"],
  "tits": ["sexual"],
  "titfuck": ["sexual"],
  "tittyfuck": ["sexual"],
  "twat": ["sexual"],
  "twatlips": ["insult"],
  "twatwaffle": ["discriminatory"],
  "unclefucker": ["discriminatory"],
  "va-j-j": ["sexual"],
  "vag": ["sexual"],
  "vagina": ["sexual"],
  "vjayjay": ["sexual"],
  "wank": ["sexual"],
  "wetback": ["discriminatory"],
  "whore": ["insult"],
  "whorebag": ["insult"],
  "whoreface": ["insult"]
};

// module.exports = swearjar;