const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require('cors');
const util = require('util')
const fs = require('node:fs');
const crypto = require('crypto');
const helpers = require('./helpers');

// Environment variables
require('dotenv').config();
const PORT = process.env.PORT || 5001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://elements.game';

// Define allowed origins
const allowedOrigins = [
    'http://localhost:3000',     // Local development
    'https://elements.game',     // Production site
    'https://www.elements.game',  // Production site with 'www' subdomain
    'https://the.elements.game'  // Production site with 'the' subdomain
  ];

// Middleware
app.use(cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true
}));

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["my-custom-header"],
    },
    allowEIO3: true // Allow Engine.IO version 3 clients if needed
});

const nameList = [
    'Time','Past','Future','Dev',
    'Fly','Flying','Soar','Soaring','Power','Falling',
    'Fall','Jump','Cliff','Mountain','Rend','Red','Blue',
    'Green','Yellow','Gold','Demon','Demonic','Panda','Cat',
    'Kitty','Kitten','Zero','Memory','Trooper','XX','Bandit',
    'Fear','Light','Glow','Tread','Deep','Deeper','Deepest',
    'Mine','Your','Worst','Enemy','Hostile','Force','Video',
    'Game','Donkey','Mule','Colt','Cult','Cultist','Magnum',
    'Gun','Assault','Recon','Trap','Trapper','Redeem','Code',
    'Script','Writer','Near','Close','Open','Cube','Circle',
    'Geo','Genome','Germ','Spaz','Shot','Echo','Beta','Alpha',
    'Gamma','Omega','Seal','Squid','Money','Cash','Lord','King',
    'Duke','Rest','Fire','Flame','Morrow','Break','Breaker','Numb',
    'Ice','Cold','Rotten','Sick','Sickly','Janitor','Camel','Rooster',
    'Sand','Desert','Dessert','Hurdle','Racer','Eraser','Erase','Big',
    'Small','Short','Tall','Sith','Bounty','Hunter','Cracked','Broken',
    'Sad','Happy','Joy','Joyful','Crimson','Destiny','Deceit','Lies',
    'Lie','Honest','Destined','Bloxxer','Hawk','Eagle','Hawker','Walker',
    'Zombie','Sarge','Capt','Captain','Punch','One','Two','Uno','Slice',
    'Slash','Melt','Melted','Melting','Fell','Wolf','Hound',
    'Legacy','Sharp','Dead','Mew','Chuckle','Bubba','Bubble','Sandwich','Smasher','Extreme','Multi','Universe','Ultimate','Death','Ready','Monkey','Elevator','Wrench','Grease','Head','Theme','Grand','Cool','Kid','Boy','Girl','Vortex','Paradox'
];

const initPlayer = (userId, playerIndex, isBot = false) => {
    return {
        id: userId,
        playerIndex: playerIndex,
        isBot: isBot,
        nickname: nameList[Math.floor( Math.random() * nameList.length )],
        color: helpers.colorifyString(userId),
        neighborhood: [],
        lastSpellCastInRound: -1,
        isScrying: false,
        attacking: "",
        order: "aefw",
        life: 1000,
        air: 0,
        earth: 0,
        fire: 0,
        water: 0,
        empower: 0,
        fortify: 0,
        winnings: 10.00
    }
}

const initGame = (roomId) => {
    var fileContents;
    try {
        fileContents = fs.readFileSync(`./games/${roomId}.txt`);
        let gameState = JSON.parse(fileContents);
        if (gameState.round <= gameState.roundCount) {
            console.log(`Loaded: ${gameState.roomId} (round ${gameState.round}) (players ${gameState.numPlayers})`);
            return gameState;
        } else {
            let randomSuffix = getRandomString(10);

            content = JSON.stringify(gameState);
            fs.writeFile(`./games/${gameState.roomId}-${randomSuffix}.txt`, content, err => {
                if (err) {
                    console.error("ERROR COPYING GAMESTATE, STILL PROCEEDING TO RESTART:", err);
                } else {
                    // file written successfully
                    console.log(`COPIED ${gameState.roomId} to ${gameState.roomId}-${randomSuffix}.txt before restarting`);
                }
            });
        }
    } catch (err) {
        // Here you get the error when the file was not found,
        // but you also get any other error
        if (!err.toString().startsWith("Error: ENOENT: no such file or directory, open")) {
            console.log(`ERROR READING FILE: ./games/${roomId}.txt : ${err}`);
        }
    }

    return {
        isTicking: false,
        roomId: roomId,
        round: 0,
        roundCount: 5,
        airPrice: 0.25,
        earthPrice: 0.25,
        firePrice: 0.25,
        waterPrice: 0.25,
        players: [],
        maxPlayers: 10,
        numPlayers: 4, // Default number of players including bots
        ante: 10.00,
        weather: "clear",
        roundDuration: 20,
        firstPlayerId: null,
        marketVariance: 5,
        lifeGrowthRate: 1.5,
        attackFriction: 0.1,
        allMoveHistory: ""
    }
}

// bot-related helper functions
function createBot(gameState, playerIndex) {
    const botId = `bot-${crypto.randomBytes(8).toString('hex')}`;
    return initPlayer(botId, playerIndex, true);
}

function addBotsIfNeeded(gameState) {
    if (gameState.round > 0) return; // Don't add bots once game has started

    const humanPlayers = gameState.players.filter(p => !p.id.startsWith('bot-')).length;
    const botsNeeded = gameState.numPlayers - humanPlayers;

    if (botsNeeded > 0) {
        console.log(`Adding ${botsNeeded} bots to game ${gameState.roomId}`);
        for (let i = 0; i < botsNeeded; i++) {
            const bot = createBot(gameState, gameState.players.length + 1);
            bot.isBot = true;
            bot.nickname = `Bot-${nameList[Math.floor(Math.random() * nameList.length)]}`;
            gameState.players.push(bot);
        }
    }
}

function processBotActions(gameState, bot) {
    // Bot's turn to take actions
    const actions = ['convert', 'attack', 'spell', 'nothing', 'attack', 'attack', 'attack'];
    const chosenAction = actions[Math.floor(Math.random() * actions.length)];

    switch(chosenAction) {
        case 'convert':
            if (bot.life >= 100) {
                const elements = ['air', 'earth', 'fire', 'water'];
                const element = elements[Math.floor(Math.random() * elements.length)];
                const amount = Math.floor(Math.random() * 5) + 1; // Convert 1-5 life units

                if (element === 'air') {
                    bot.air += (amount * 100 / gameState.airPrice);
                } else if (element === 'earth') {
                    bot.earth += (amount * 100 / gameState.earthPrice);
                } else if (element === 'fire') {
                    bot.fire += (amount * 100 / gameState.firePrice);
                } else if (element === 'water') {
                    bot.water += (amount * 100 / gameState.waterPrice);
                }
                bot.life -= amount * 100;
                gameState.allMoveHistory += `[P${bot.playerIndex}:convert(${element})]`;
            }
            break;

        case 'attack':
            if (bot.neighborhood && bot.neighborhood.length > 0) {
                const targetIndex = Math.floor(Math.random() * bot.neighborhood.length);
                bot.attacking = bot.neighborhood[targetIndex].playerIndex;
                gameState.allMoveHistory += `[P${bot.playerIndex}:attack(${bot.attacking})]`;
            }
            break;

        case 'spell':
            if (bot.lastSpellCastInRound < gameState.round) {
                const availableSpells = [];

                if (bot.air >= 100 && bot.earth >= 100 && bot.fire >= 100) {
                    availableSpells.push('empower');
                }
                if (bot.fire >= 100 && bot.earth >= 100 && bot.water >= 100) {
                    availableSpells.push('fortify');
                }
                if (bot.air >= 100 && bot.fire >= 100 && bot.water >= 100) {
                    availableSpells.push('scry');
                }
                if (bot.air >= 100 && bot.earth >= 100 && bot.water >= 100) {
                    availableSpells.push('seed');
                }

                if (availableSpells.length > 0) {
                    const spell = availableSpells[Math.floor(Math.random() * availableSpells.length)];

                    switch(spell) {
                        case 'empower':
                            bot.air -= 100;
                            bot.earth -= 100;
                            bot.fire -= 100;
                            bot.empower += 1000;
                            break;
                        case 'fortify':
                            bot.fire -= 100;
                            bot.earth -= 100;
                            bot.water -= 100;
                            bot.fortify += 1000;
                            break;
                        case 'scry':
                            bot.air -= 100;
                            bot.fire -= 100;
                            bot.water -= 100;
                            bot.isScrying = true;
                            break;
                        case 'seed':
                            bot.air -= 100;
                            bot.earth -= 100;
                            bot.water -= 100;
                            bot.life += 300;
                            break;
                    }
                    bot.lastSpellCastInRound = gameState.round;
                    gameState.allMoveHistory += `[P${bot.playerIndex}:spell(${spell})]`;
                }
            }
            break;

        case 'nothing':
            // Bot chooses to do nothing this turn
            gameState.allMoveHistory += `[P${bot.playerIndex}:nothing]`;
            break;
    }
}

function getPublicPlayerInfo(player) {
    // Only return non-sensitive information
    return {
        id: player.id,
        nickname: player.nickname,
        color: player.color,
        playerIndex: player.playerIndex,
        isBot: player.isBot
    };
}

let knownGameStates = {}

function addPlayerToGame(userId, gameState) {
    if (gameState.round > 0) {
        // Can't join game already in-progress
        return;
    }

    player = gameState.players.find((p) => {return p.id == userId});

    if (player !== undefined) {
        // Don't try to double-add
        return;
    }

    console.log(`User ${userId} joining game ${gameState.roomId}`);
    let newPlayer = initPlayer(userId, gameState.players.length + 1);
    gameState.players.push(newPlayer);
    io.to(userId).emit('playerState', {room: gameState.roomId, user: userId, playerState: newPlayer, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
    io.to(gameState.roomId).emit('newRound', {
        round: gameState.round,
        weather: gameState.weather,
        airPrice: gameState.airPrice,
        earthPrice: gameState.earthPrice,
        firePrice: gameState.firePrice,
        waterPrice: gameState.waterPrice,
    });
}

function getPlayerByPlayerIndex(gameState, playerIndex) {
    return gameState.players.find((p) => {return p.playerIndex == playerIndex});
}

function allocateWinnings(gameState) {
    let totalPotSize = gameState.ante * gameState.players.length;

    let lifeAndElementGrandTotal = 0;
    let playerLifeAndElementScores = [];

    for (player of gameState.players) {
        let playerValue = player.life + ((player.air + player.earth + player.fire + player.water) / 4);
        playerLifeAndElementScores.push(playerValue);
        lifeAndElementGrandTotal += playerValue;
    }

    for (let i = 0; i < gameState.players.length; i++) {
        let player = gameState.players[i];
        let playerVal = playerLifeAndElementScores[i];
        player.winnings = Math.round((playerVal / lifeAndElementGrandTotal) * totalPotSize * 100) / 100;
    }
}

function saveGameState(gameState) {
    content = JSON.stringify(gameState);
    fs.writeFile(`./games/${gameState.roomId}.txt`, content, err => {
        if (err) {
          console.error(err);
        }
    });
}

function getRandomString(strLen = 7) {
    // This only generates a max of 10-11 char alphanumerical strings
    // (could extend to longer strings by joining multiple such results)
    return Math.random().toString(36).substring(2, strLen+2);
}

function arrContains(arr, val) {
    return arr.some((arrVal) => val === arrVal.id);
}

function isGameDone(gameState) {
    return ((gameState.round >= gameState.roundCount) || (gameState.round > 0 && (gameState.players.filter(p => p.life > 0).length <= 1)));
}

io.on('connection', (socket) => {
    socket.on("joinRoom", (args) => {
        let roomId = args.roomId ? args.roomId : getRandomString(10);
        let userUid = args.userUid ? args.userUid : "";
        if (userUid.length > 0) {
            socket.join(userUid);
        }
        if (roomId.length > 0) {
            socket.join(roomId);
        }

        let gameState = knownGameStates[roomId];
        if (gameState === undefined || !knownGameStates[roomId]) {
            console.log(`CREATING ROOM ${roomId}`);
            // once we allow customizing game settings, it'll go here
            knownGameStates[roomId] = initGame(roomId);
            gameState = knownGameStates[roomId];
            gameState.firstPlayerId = userUid; // Set first player
        }

        addPlayerToGame(userUid, gameState);

        player = gameState.players.find((p) => {return p.id == userUid});

        let isSpectator = gameState.round > 0 && !player;
        if (isSpectator) {
            // For spectators, only send public info about current players
            io.to(userUid).emit('spectatorState', {
                room: roomId,
                players: gameState.players.map(p => ({
                    nickname: p.nickname,
                    color: p.color,
                    playerIndex: p.playerIndex
                })),
                currentRound: gameState.round,
                roundCount: gameState.roundCount,
                isGameOver: isGameDone(gameState),
                winningsStats: gameState.players.map(p => ({
                    playerIndex: p.playerIndex,
                    nickname: p.nickname,
                    winnings: p.winnings
                }))
            });
        } else {
            // For playing players, emit their details
            // Emit first player status
            io.to(userUid).emit('firstPlayerStatus', {
                isFirstPlayer: userUid === gameState.firstPlayerId
            });

            // Emit current game settings
            io.to(roomId).emit('gameSettings', {
                roundCount: gameState.roundCount,
                roundDuration: gameState.roundDuration
            });

            io.to(userUid).emit('playerState', {room: roomId, user: userUid, playerState: player, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
            io.to(roomId).emit('newRound', {
                round: gameState.round,
                weather: gameState.weather,
                airPrice: gameState.airPrice,
                earthPrice: gameState.earthPrice,
                firePrice: gameState.firePrice,
                waterPrice: gameState.waterPrice,
            });
        }

        if (isGameDone(gameState)) {
            console.log(`Game ${roomId} complete; emitting game results`);
            io.to(roomId).emit('gameResults', gameState);
        }
    });


    // Add new socket handler for game settings updates
    socket.on("updateGameSettings", (args) => {
        if (!args.roomId) return;

        let gameState = knownGameStates[args.roomId];
        if (gameState === undefined) return;

        // Only allow first player to update settings
        //if (args.userUid !== gameState.firstPlayerId) return;

        // Only allow updates before game starts
        if (gameState.round > 0) return;

        // Update settings
        if (args.settings.roundCount) {
            gameState.roundCount = Math.min(Math.max(parseInt(args.settings.roundCount), 1), 50);
        }
        if (args.settings.roundDuration) {
            gameState.roundDuration = Math.min(Math.max(parseInt(args.settings.roundDuration), 5), 300);
        }
        if (args.settings.numPlayers) {
            gameState.numPlayers = Math.min(Math.max(parseInt(args.settings.numPlayers), 1), 20);
        }
        if (args.settings.marketVariance) {
            gameState.marketVariance = Math.min(Math.max(parseInt(args.settings.marketVariance), 1), 10);
        }
        if (args.settings.attackFriction) {
            gameState.attackFriction = Math.min(Math.max(parseFloat(args.settings.attackFriction), 0), 1);
        }
        if (args.settings.lifeGrowthRate) {
            gameState.lifeGrowthRate = Math.min(Math.max(parseFloat(args.settings.lifeGrowthRate), 1), 10);
        }

        // Save game state
        saveGameState(gameState);

        // Broadcast new settings to all players in the room
        io.to(args.roomId).emit('gameSettings', {
            roundCount: gameState.roundCount,
            roundDuration: gameState.roundDuration,
            numPlayers: gameState.numPlayers
        });
    });

    
    socket.on("startGame", (args) => {
        if (!args.roomId) return;
        let gameState = knownGameStates[args.roomId];
        if (gameState === undefined) return;

        // We *might* only want to allow first player to start the game
        // but for now we're lazy
        // if (args.userUid !== gameState.firstPlayerId) return;

        // Only allow starting if game hasn't begun
        if (gameState.round > 0) return;

        // Add bots before starting the game
        addBotsIfNeeded(gameState);

        // Start the game by incrementing round to 1
        gameState.round = 1;

        // Initialize the timer
        gameState.isTicking = true;
        gameState.remainingTime = gameState.roundDuration;

        // Generate initial market prices and weather
        gameState.weather = generateWeather();
        let newPrices = generateMarket(gameState.marketVariance);
        gameState.airPrice = newPrices.airPrice;
        gameState.earthPrice = newPrices.earthPrice;
        gameState.firePrice = newPrices.firePrice;
        gameState.waterPrice = newPrices.waterPrice;

        // Save the game state
        saveGameState(gameState);

        console.log("::::::::::::::::XXXXXXXXXXXX:::::::::::::::: Starting game", gameState);

        // Notify all clients about the new round
        io.to(args.roomId).emit('newRound', {
            round: gameState.round,
            weather: gameState.weather,
            airPrice: gameState.airPrice,
            earthPrice: gameState.earthPrice,
            firePrice: gameState.firePrice,
            waterPrice: gameState.waterPrice
        });
    });

    socket.on("submit", (args) => {
        console.log("GOT SUBMISSION WITH ARGUS:", args);

        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return
        }
        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // Auto-join for now (if still in round 0)
            addPlayerToGame(userId, gameState);
        }

        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        if (args.text.startsWith("/attack")) {
            let playerToAttack = args.text.split(" ")[1];
            player.attacking = parseInt(playerToAttack);
            return;
        }

        if (args.text.startsWith("/order")) {
            let newOrder = args.text.split(" ")[1];
            player.order = newOrder;
            return;
        }

        let timeString = new Date().getTime().toString();
        let argsHash = helpers.hashCode(JSON.stringify(args) + timeString);
        io.to(roomId).emit('newMessage', {room: roomId, text: args.text, user: player.nickname, color: player.color, id: argsHash, key: argsHash})
    });

    socket.on("updateNickname", (args) => {
        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return
        }
        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // Auto-join for now
            addPlayerToGame(userId, gameState);
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        player.nickname = args.nickname;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
    });

    socket.on("queueAttack", (args) => {
        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return
        }
        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // Auto-join for now
            addPlayerToGame(userId, gameState);
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        console.log(`⚔️⚔️⚔️  Player ${player.playerIndex} attacking Player ${args.targetPlayerIndex} 🛡️🛡️🛡️`);

        player.attacking = args.targetPlayerIndex;
        gameState.allMoveHistory += `[P${player.playerIndex}:attack(${args.targetPlayerIndex})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
    });

    socket.on("unqueueAttack", (args) => {
        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return
        }
        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // Auto-join for now
            addPlayerToGame(userId, gameState);
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        console.log(`⚔️⚔️⚔️  Player ${player.playerIndex} unattacking Player ${args.targetPlayerIndex} 🛡️🛡️🛡️`);

        player.attacking = "";
        gameState.allMoveHistory += `[P${player.playerIndex}:cancelattack(${args.targetPlayerIndex})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
    });

    socket.on("updateOrder", (args) => {
        if (!args.order) {
            return
        }

        if (args.order.length != 4) {
            return
        }

        if (!(args.order.indexOf("a") > -1 && args.order.indexOf("e") > -1 && args.order.indexOf("f") > -1 && args.order.indexOf("w") > -1)) {
            return
        }

        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return
        }
        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // Auto-join for now
            addPlayerToGame(userId, gameState);
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        player.order = args.order;

        gameState.allMoveHistory += `[P${player.playerIndex}:reorder(${args.order})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
    });

    socket.on("convert", (args) => {
        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return;
        }

        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // TODO: we can just `return` here, after gameState saving+loading (for server rebootage) is done
            //return
            // Auto-join for now
            addPlayerToGame(userId, gameState);
        }

        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        let baseAmount = 100 * args.amount;

        if (player.life >= baseAmount) {
            player.life -= baseAmount;
            theElement = args.element;
            if (theElement === "air") {
                player[theElement] += (baseAmount / gameState.airPrice)
            } else if (theElement === "earth") {
                player[theElement] += (baseAmount / gameState.earthPrice)
            } else if (theElement === "fire") {
                player[theElement] += (baseAmount / gameState.firePrice)
            } else if (theElement === "water") {
                player[theElement] += (baseAmount / gameState.waterPrice)
            }
        }

        gameState.allMoveHistory += `[P${player.playerIndex}:convert(${args.element})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
    });

    socket.on("castSpell", (args) => {
        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return;
        }

        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // TODO: we can just `return` here, after gameState saving+loading (for server rebootage) is done
            //return
            // Auto-join for now
            addPlayerToGame(userId, gameState);
        }

        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        theSpell = args.spell;
        if (theSpell === "empower") {
            if (player.lastSpellCastInRound < gameState.round && player.air >= 100 && player.earth >= 100 && player.fire >= 100) {
                player.air -= 100;
                player.earth -= 100;
                player.fire -= 100;
                player.lastSpellCastInRound = gameState.round;
                player.empower += 1000;
            } else {
                console.log("Ineligible to cast ", theSpell)
            }
        } else if (theSpell === "fortify") {
            if (player.lastSpellCastInRound < gameState.round && player.fire >= 100 && player.earth >= 100 && player.water >= 100) {
                player.fire -= 100;
                player.earth -= 100;
                player.water -= 100;
                player.lastSpellCastInRound = gameState.round;
                player.fortify += 1000;
            } else {
                console.log("Ineligible to cast ", theSpell)
            }
        } else if (theSpell === "scry") {
            if (player.lastSpellCastInRound < gameState.round && player.air >= 100 && player.fire >= 100 && player.water >= 100) {
                player.air -= 100;
                player.fire -= 100;
                player.water -= 100;
                player.lastSpellCastInRound = gameState.round;
                player.isScrying = true;
                for (p = 0; p < player.neighborhood.length; p++) {
                    visiblePlayer = player.neighborhood[p];
                    let theFullPlayer = getPlayerByPlayerIndex(gameState, visiblePlayer.playerIndex);
                    visiblePlayer.netWorth = theFullPlayer.life + theFullPlayer.air + theFullPlayer.earth + theFullPlayer.fire + theFullPlayer.water;
                }
            } else {
                console.log("Ineligible to cast ", theSpell)
            }
        } else if (theSpell === "seed") {
            if (player.lastSpellCastInRound < gameState.round && player.air >= 100 && player.earth >= 100 && player.water >= 100) {
                player.air -= 100;
                player.earth -= 100;
                player.water -= 100;
                player.lastSpellCastInRound = gameState.round;
                player.life += 300;
            } else {
                console.log("Ineligible to cast ", theSpell)
            }
        } else {
            console.log("Ignoring spell: ", theSpell)
        }

        gameState.allMoveHistory += `[P${player.playerIndex}:spell(${args.spell})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player, allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
    });

    socket.on("startRoundTimer", (args) => {
        console.log("START RT", args);
        let gameState = knownGameStates[args.room];
        if (gameState === undefined) {
            return
        }
        gameState.isTicking = true;
        console.log("BEGINNING TIMER:", args.room);
        io.to(args.room).emit('autoProceed');
        socket.to(args.room).emit('autoProceed');
    });

    socket.on("stopRoundTimer", (args) => {
        let gameState = knownGameStates[args.room];
        if (gameState === undefined) {
            return
        }
        gameState.isTicking = false;
        console.log("STOPPED TIMER:", args.room);
        io.to(args.room).emit('paused');
        socket.to(args.room).emit('paused');
    });

    socket.on("nextRound", (args) => {
        roomId = args.room;
        processRoundAndProceed(roomId);
        console.log(`Manually proceeding to round ${gameState.round} in game ID: ${roomId}`);
    });


    socket.on("updateRoundDuration", (args) => {
        if (!(args.roomId && args.userUid)) {
            return;
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        
        if (gameState === undefined) {
            return;
        }

        // Only allow duration changes before the game starts
        if (gameState.round > 0) {
            return;
        }

        // Validate the new duration (minimum 5 seconds, maximum 300 seconds)
        const newDuration = Math.min(Math.max(parseInt(args.duration) || 20, 5), 300);
        
        gameState.roundDuration = newDuration;
        gameState.allMoveHistory += `[S:roundDuration(${newDuration})]`;
        
        saveGameState(gameState);
        
        // Notify all clients in the room about the duration change
        io.to(roomId).emit('roundDurationUpdate', {
            room: roomId,
            roundDuration: newDuration
        });
    });

    socket.on('disconnect', () => {
        console.debug("Disconnected from socket");
    });
});


// Basic route for checking if server is running
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Basic health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

function combat(attackingArmy, defendingArmy, weather, defenderLife, attackFriction) {
    let attackMultiplier = 1 - attackFriction; // Attack Friction reduces attack effectiveness
    let defendMultiplier = 1

    if (attackingArmy.element == "air" && defendingArmy.element == "earth") {
        defendMultiplier /= 2
    } else if (attackingArmy.element == "air" && defendingArmy.element == "fire") {
        attackMultiplier /= 2
    } else if (attackingArmy.element == "earth" && defendingArmy.element == "air") {
        attackMultiplier /= 2
    } else if (attackingArmy.element == "earth" && defendingArmy.element == "water") {
        defendMultiplier /= 2
    } else if (attackingArmy.element == "fire" && defendingArmy.element == "air") {
        defendMultiplier /= 2
    } else if (attackingArmy.element == "fire" && defendingArmy.element == "water") {
        attackMultiplier /= 2
    } else if (attackingArmy.element == "water" && defendingArmy.element == "earth") {
        attackMultiplier /= 2
    } else if (attackingArmy.element == "water" && defendingArmy.element == "fire") {
        defendMultiplier /= 2
    }

    if (weather == "tornado") {
        if (attackingArmy.element == "air") {
            defendMultiplier /= 2
        }
        if (defendingArmy.element == "air") {
            attackMultiplier /= 2
        }
    } else if (weather == "flood") {
        if (attackingArmy.element == "water") {
            defendMultiplier /= 2
        }
        if (defendingArmy.element == "water") {
            attackMultiplier /= 2
        }
    } else if ( weather == "comet") {
        if (attackingArmy.element == "fire") {
            defendMultiplier /= 2
        }
        if (defendingArmy.element == "fire") {
            attackMultiplier /= 2
        }
    } else if ( weather == "earthquake") {
        if (attackingArmy.element == "earth") {
            defendMultiplier /= 2
        }
        if (defendingArmy.element == "earth") {
            attackMultiplier /= 2
        }
    }

    totalAttackScore = attackingArmy.size * attackMultiplier
    totalDefendScore = defendingArmy.size * defendMultiplier

    console.log(`Total (${attackingArmy.element}) Attack Score: ${totalAttackScore}`)
    console.log(`Total (${defendingArmy.element}) Defend Score: ${totalDefendScore}`)
    const uniqueId = crypto.randomBytes(16).toString('hex');

    if (totalAttackScore > totalDefendScore) {
        // Attacker wins
        return {
            "id": uniqueId,
            "attackTroopColor": helpers.colorFromElement(attackingArmy.element),
            "defendTroopColor": helpers.colorFromElement(defendingArmy.element),
            "attackRemaining": totalAttackScore - totalDefendScore,
            "defendRemaining": 0,
            "lifeLooted": Math.min(defenderLife, totalAttackScore - totalDefendScore)
        }
    } else if (totalDefendScore > totalAttackScore) {
        // Defender wins
        return {
            "id": uniqueId,
            "attackTroopColor": helpers.colorFromElement(attackingArmy.element),
            "defendTroopColor": helpers.colorFromElement(defendingArmy.element),
            "attackRemaining": 0,
            "defendRemaining": totalDefendScore - totalAttackScore,
            "lifeLooted": 0
        }
    } else {
        return {
            "id": uniqueId,
            "attackTroopColor": helpers.colorFromElement(attackingArmy.element),
            "defendTroopColor": helpers.colorFromElement(defendingArmy.element),
            "attackRemaining": 0,
            "defendRemaining": 0,
            "lifeLooted": 0
        }
    }
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max) + 1;
  }

function generateWeather() {
    let weatherSeed = getRandomInt(100);
    weather = ""
    if (weatherSeed < 60) {
        weather = "Clear"
    } else if(weatherSeed < 70) {
        weather = "Tornado"
    } else if (weatherSeed < 80) {
        weather = "Comet"
    } else if (weatherSeed < 90) {
        weather = "Flood"
    } else {
        weather = "Earthquake"
    }

    return weather
}

function generateMarket(variance = 5) {
    // If variance is 1, all prices should be 0.25
    // If variance is 10, should work like the original function
    // Scale variance to 0-1 range for interpolation
    const varianceFactor = (variance - 1) / 9;
    
    // Generate raw random values
    let rawAirRNG = getRandomInt(100);
    let rawEarthRNG = getRandomInt(100);
    let rawFireRNG = getRandomInt(100);
    let rawWaterRNG = getRandomInt(100);
    let rawTotal = rawAirRNG + rawEarthRNG + rawFireRNG + rawWaterRNG;
    
    // Calculate fully random prices (sum to 1)
    const randomAirPrice = rawAirRNG / rawTotal;
    const randomEarthPrice = rawEarthRNG / rawTotal;
    const randomFirePrice = rawFireRNG / rawTotal;
    const randomWaterPrice = rawWaterRNG / rawTotal;
    
    // Stable price (0.25 each)
    const stablePrice = 0.25;
    
    // Interpolate between stable and random prices based on variance
    return {
        airPrice: Math.round((stablePrice * (1 - varianceFactor) + randomAirPrice * varianceFactor) * 10000) / 10000,
        earthPrice: Math.round((stablePrice * (1 - varianceFactor) + randomEarthPrice * varianceFactor) * 10000) / 10000,
        firePrice: Math.round((stablePrice * (1 - varianceFactor) + randomFirePrice * varianceFactor) * 10000) / 10000,
        waterPrice: Math.round((stablePrice * (1 - varianceFactor) + randomWaterPrice * varianceFactor) * 10000) / 10000
    };
}

function generateNeighborhood(gameState, playerIndex) {
    let totalPlayerCount = gameState.players.length;
    let maxNeighborhoodSize = 1;

    if (totalPlayerCount < 2) {
        return;
    } else if (totalPlayerCount > 2 && totalPlayerCount < 4) {
        maxNeighborhoodSize = 2;
    } else if (totalPlayerCount >= 4 && totalPlayerCount < 8) {
        maxNeighborhoodSize = 3;
    } else if (totalPlayerCount >= 8) {
        maxNeighborhoodSize = 4;
    }

    // TODO: skew more towards 2-3 than towards 1 or 4
    let neighborhoodSize = getRandomInt(maxNeighborhoodSize);

    let neighborhood = [];
    let neighborhoodIndices = [];

    let i = 0; 
    
    while (i < neighborhoodSize) {
        let candidateNeighbor = getRandomInt(totalPlayerCount);
        // TODO: fix this indexOf because the visibleNeighborDetails isn't just a number anymore
        if (candidateNeighbor !== playerIndex && neighborhoodIndices.indexOf(candidateNeighbor) == -1) {
            newNeighbor = getPlayerByPlayerIndex(gameState, candidateNeighbor);

            let visibleNeighborDetails = {playerIndex: newNeighbor.playerIndex, color: newNeighbor.color, nickname: newNeighbor.nickname};

            neighborhood.push(visibleNeighborDetails);
            neighborhoodIndices.push(candidateNeighbor);
            i++;
        }
    }

    player = getPlayerByPlayerIndex(gameState, playerIndex);
    player.neighborhood = neighborhood;
}

function topTroops(player, attackingOrDefending) {
    // Prioritize empower and fortify buffs first
    if (attackingOrDefending == "attack" && player.empower > 0) {
        return {troopType: "empower", amount: player.empower}
    }

    // Prioritize empower and fortify buffs first
    if (attackingOrDefending == "defend" && player.fortify > 0) {
        return {troopType: "fortify", amount: player.fortify}
    }

    // Return first nonzero element from player's troop ordering
    for (let c = 0; c < player.order.length; c++) {
        let troopType = helpers.letterToElement(player.order.charAt(c));
        if (player[troopType] > 0) {
            return {troopType: troopType, amount: player[troopType]}
        }
    }
            
    return {troopType: "none", amount: 0}
}

function getAllTroops(player, attackingOrDefending) {
    let troops = [];
    
    // First check for buffs
    if (attackingOrDefending === "attack" && player.empower > 0) {
        troops.push({troopType: "empower", amount: player.empower});
    }
    
    if (attackingOrDefending === "defend" && player.fortify > 0) {
        troops.push({troopType: "fortify", amount: player.fortify});
    }
    
    // Then add all non-zero elements in order
    for (let c = 0; c < player.order.length; c++) {
        let troopType = helpers.letterToElement(player.order.charAt(c));
        if (player[troopType] > 0) {
            troops.push({troopType: troopType, amount: player[troopType]});
        }
    }
    
    return troops;
}


function calculateTroopVisuals(amount) {
    // Since the game internally uses values multiplied by 100,
    // we need to scale them down for visual representation
    return Math.round(amount / 100);
}

function emitSkirmishEventWithDelay(io, roomId, event, delay) {
    setTimeout(() => {
        const timeString = new Date().getTime().toString();
        const eventHash = helpers.hashCode(JSON.stringify(event) + timeString);
        
        // Scale down amounts for visual representation
        const scaledEvent = {
            ...event,
            amount: event.amount ? calculateTroopVisuals(event.amount) : 0,
            lifeLooted: event.lifeLooted ? calculateTroopVisuals(event.lifeLooted) : 0,
            id: eventHash,
            key: eventHash,
            room: roomId
        };
        
        io.to(event.defenderId).emit('skirmishResult', scaledEvent);
        io.to(event.attackerId).emit('skirmishResult', scaledEvent);
    }, delay);
}

function processRoundAndProceed(roomId) {
    gameState = knownGameStates[roomId];

    if (isGameDone(gameState)) {
        console.log(`Game ${roomId} complete; balancing market and allocating winnings`);
        gameState.isTicking = false;
        gameState.airPrice = 0.25
        gameState.earthPrice = 0.25
        gameState.firePrice = 0.25
        gameState.waterPrice = 0.25
        allocateWinnings(gameState);
        saveGameState(gameState);
        io.to(roomId).emit('gameResults', gameState);
        return;
    }

    console.log(`Game ${roomId} PROCESSING ROUND ${gameState.round} AND PROCEEDING`);
    let playerTurns = [...Array(gameState.players.length).keys()];
    shuffle(playerTurns);
    console.log("PLAYER TURNS:", playerTurns);

    for (turn of playerTurns) {
        playingPlayer = gameState.players[turn];

        // Handle bot actions
        if (playingPlayer.isBot) {
            processBotActions(gameState, playingPlayer);
        }

        console.log(`TURN ${turn} PLAYER: ${playingPlayer.id}`);
        if (playingPlayer.attacking > 0) {
            let defendingPlayer = getPlayerByPlayerIndex(gameState, playingPlayer.attacking);
            if (defendingPlayer.id === playingPlayer.id) {
                continue; // Can't attack yourself
            }
        
            gameState.allMoveHistory += `[P${playingPlayer.playerIndex}:attack(${playingPlayer.attacking})]`;
        
            console.log(`Player ${playingPlayer.playerIndex} (${playingPlayer.nickname}) ATTACKING THE DEFENDER: ${defendingPlayer.playerIndex} (${defendingPlayer.nickname})`);
            
            let cumulativeDelay = 0;
            const TROOPS_OUT_DURATION = 600;
            const COMBAT_DURATION = 500;
            const TROOPS_RETURN_DURATION = 1000;
            const SKIRMISH_GAP = 100;
        
            // Get all available troops for both players
            let attackingTroops = getAllTroops(playingPlayer, "attack");
            let defendingTroops = getAllTroops(defendingPlayer, "defend");
            let totalLootableLife = defendingPlayer.life;
            let totalLifeLooted = 0;
            let lootingAnimations = []; // Store looting animations for later

            // First phase: Process all combat
            for (let attackingTroop of attackingTroops) {
                // Get corresponding defending troop
                let defendingTroop = defendingTroops.length > 0 ? defendingTroops[0] : {troopType: "none", amount: 0};
                
                // Emit troops-out event
                emitSkirmishEventWithDelay(io, roomId, {
                    type: 'troops-out',
                    attackerId: playingPlayer.id,
                    defenderId: defendingPlayer.id,
                    element: attackingTroop.troopType,
                    amount: attackingTroop.amount
                }, cumulativeDelay);
                
                // Process combat
                let battleResults = combat(
                    {size: attackingTroop.amount, element: attackingTroop.troopType},
                    {size: defendingTroop.amount, element: defendingTroop.troopType},
                    gameState.weather,
                    totalLootableLife,
                    gameState.attackFriction
                );
                
                // Update states
                playingPlayer[attackingTroop.troopType] = battleResults.attackRemaining;
                if (defendingTroop.troopType !== "none") {
                    defendingPlayer[defendingTroop.troopType] = battleResults.defendRemaining;
                    defendingTroops.shift();
                }

                // Update lootable life and store looting animation if needed
                if (battleResults.lifeLooted > 0) {
                    totalLootableLife -= battleResults.lifeLooted;
                    totalLifeLooted += battleResults.lifeLooted;
                    lootingAnimations.push({
                        element: attackingTroop.troopType,
                        amount: battleResults.attackRemaining,
                        lifeLooted: battleResults.lifeLooted
                    });
                    
                    // Emit skirmish-result with life looting
                    emitSkirmishEventWithDelay(io, roomId, {
                        type: 'skirmish-result',
                        attackerId: playingPlayer.id,
                        defenderId: defendingPlayer.id,
                        attackElement: attackingTroop.troopType,
                        defendElement: defendingTroop.troopType,
                        attackRemaining: battleResults.attackRemaining,
                        defendRemaining: battleResults.defendRemaining,
                        lifeLooted: battleResults.lifeLooted
                    }, cumulativeDelay + TROOPS_OUT_DURATION);
                } else {
                    // Only emit skirmish-result if no life was looted
                    emitSkirmishEventWithDelay(io, roomId, {
                        type: 'skirmish-result',
                        attackerId: playingPlayer.id,
                        defenderId: defendingPlayer.id,
                        attackElement: attackingTroop.troopType,
                        defendElement: defendingTroop.troopType,
                        attackRemaining: battleResults.attackRemaining,
                        defendRemaining: battleResults.defendRemaining,
                        lifeLooted: 0
                    }, cumulativeDelay + TROOPS_OUT_DURATION);
                }
                
                // If troops are returning (without loot), emit return event
                if (battleResults.attackRemaining > 0 && battleResults.lifeLooted === 0) {
                    emitSkirmishEventWithDelay(io, roomId, {
                        type: 'troops-return',
                        attackerId: playingPlayer.id,
                        defenderId: defendingPlayer.id,
                        element: attackingTroop.troopType,
                        amount: battleResults.attackRemaining,
                        lifeLooted: 0
                    }, cumulativeDelay + TROOPS_OUT_DURATION + COMBAT_DURATION);
                }
                
                // Increase delay for next troop type
                cumulativeDelay += TROOPS_OUT_DURATION + COMBAT_DURATION + TROOPS_RETURN_DURATION + SKIRMISH_GAP;
            }
        
            // Second phase: Process all looting animations after combat is complete
            for (let lootingAnimation of lootingAnimations) {
                // For the attacker: show troops returning with loot
                emitSkirmishEventWithDelay(io, roomId, {
                    type: 'troops-return',
                    attackerId: playingPlayer.id,
                    defenderId: defendingPlayer.id,
                    element: lootingAnimation.element,
                    amount: lootingAnimation.amount,
                    lifeLooted: lootingAnimation.lifeLooted
                }, cumulativeDelay);
        
                // No need for a separate skirmish-result event
                // The troops-return event with lifeLooted > 0 will trigger
                // the appropriate animation for both attacker and defender
        
                // Increase delay for next looting animation
                cumulativeDelay += TROOPS_OUT_DURATION + SKIRMISH_GAP;
            }
        
            // Update final life totals after all combat and looting is complete
            if (totalLifeLooted > 0) {
                defendingPlayer.life -= totalLifeLooted;
                playingPlayer.life += totalLifeLooted;
                console.log("TOTAL LIFE LOOTED:", totalLifeLooted);
            }
        
            // Make sure the game state updates after all animations complete
            setTimeout(() => {
                // Update player states and emit other end-of-round events
                for (const player of gameState.players) {
                    player.life = player.life * gameState.lifeGrowthRate;
                    player.attacking = "";
                    player.isScrying = false;
                    generateNeighborhood(gameState, player.playerIndex);
                    if (!player.isBot) {
                        io.to(player.id).emit('playerState', {
                            room: roomId,
                            user: player.id,
                            playerState: player,
                            allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))
                        });
                    }
                }
            }, cumulativeDelay + 1000); // Add buffer after last animation
        }
    }

    // Now double everyone's life and alert them of playerState changes
    for (const player of gameState.players) {
        player.life = player.life * gameState.lifeGrowthRate;
        player.attacking = "";
        player.isScrying = false;
        generateNeighborhood(gameState, player.playerIndex);
        if (!player.isBot) {
            io.to(player.id).emit('playerState', {room: roomId, user: player.id, playerState: player,
                allPlayers: gameState.players.map(p => getPublicPlayerInfo(p))});
        }
    }

    // Check if only one player has life remaining
    const playersWithLife = gameState.players.filter(player => player.life > 0);
    if (playersWithLife.length === 1) {
        // We have a winner! End the game and allocate all winnings to the winner
        const winner = playersWithLife[0];
        console.log(`Game ${roomId} complete; Player ${winner.nickname} wins by elimination!`);
        gameState.isTicking = false;
        
        // Set market prices to default
        gameState.airPrice = 0.25;
        gameState.earthPrice = 0.25;
        gameState.firePrice = 0.25;
        gameState.waterPrice = 0.25;
        
        // Allocate all winnings to the winner
        const totalPot = gameState.ante * gameState.players.length;
        gameState.players.forEach(player => {
            player.winnings = player.id === winner.id ? totalPot : 0;
        });
        
        gameState.allMoveHistory += `[S:exterminator(${winner.playerIndex})]`;
        saveGameState(gameState);
        io.to(roomId).emit('gameResults', gameState);
        return;
    }

    gameState.weather = generateWeather();
    let newPrices = generateMarket(gameState.marketVariance);
    gameState.airPrice = newPrices.airPrice;
    gameState.earthPrice = newPrices.earthPrice;
    gameState.firePrice = newPrices.firePrice;
    gameState.waterPrice = newPrices.waterPrice;
    gameState.round = gameState.round + 1;
    gameState.allMoveHistory += `[S:a(${gameState.airPrice}),e(${gameState.earthPrice}),f(${gameState.firePrice}),w(${gameState.waterPrice}),weather(${gameState.weather})]`
    saveGameState(gameState);

    gameState.remainingTime = gameState.roundDuration;

    io.to(roomId).emit('newRound', {
        round: gameState.round,
        weather: gameState.weather,
        airPrice: gameState.airPrice,
        earthPrice: gameState.earthPrice,
        firePrice: gameState.firePrice,
        waterPrice: gameState.waterPrice
    });

    // Broadcast the reset timer state
    io.to(roomId).emit('syncTimer', { 
        remainingTime: gameState.remainingTime,
        duration: gameState.roundDuration
    });
}

setInterval(() => {
    for (const [roomId, gameState] of Object.entries(knownGameStates)) {
        if (gameState.isTicking) {
            // Initialize remainingTime if it doesn't exist
            if (gameState.remainingTime === undefined) {
                // Use game-specific duration or fall back to default
                gameState.remainingTime = gameState.roundDuration;
            }

            gameState.remainingTime -= 1;

            if (gameState.remainingTime <= 0) {
                // Time's up - process the round
                console.log(`Ticking and proceeding to round ${gameState.round} in game ID: ${roomId}`);
                processRoundAndProceed(roomId);
                // Reset the timer using game-specific duration
                gameState.remainingTime = gameState.roundDuration;
            } else {
                // Emit both duration and remaining time to all clients
                io.to(roomId).emit('syncTimer', { 
                    remainingTime: gameState.remainingTime,
                    duration: gameState.roundDuration
                });
            }
        }
    }
}, 1000);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  }).on('error', (err) => {
    console.error('Server failed to start:', err);
    process.exit(1); // Exit on error so Heroku can restart
  });