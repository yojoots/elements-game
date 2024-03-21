const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const util = require('util')
const fs = require('node:fs');

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
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

const initPlayer = (userId, playerIndex) => {
    return {
        id: userId,
        playerIndex: playerIndex,
        nickname: nameList[Math.floor( Math.random() * nameList.length )],
        color: stringToColour(userId),
        neighborhood: [],
        lastSpellCastInRound: -1,
        isScrying: false,
        attacking: "",
        order: "aefw",
        life: 2000,
        air: 0,
        earth: 0,
        fire: 0,
        water: 0,
        empower: 0,
        fortify: 0,
        winnings: 20.00
    }
}

const initGame = (roomId) => {
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
        ante: 20.00,
        weather: "clear",
        roundDuration: 30,
        allMoveHistory: ""
    }
}

let knownGameStates = {}

const stringToColour = (str) => {
    let hash = 0;
    str.split('').forEach(char => {
      hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff
      colour += value.toString(16).padStart(2, '0')
    }
    return colour
}

function addPlayerToGame(userId, gameId) {
    let gameState = knownGameStates[gameId];
    if (gameState === undefined || !knownGameStates[gameId]) {
        console.log("CREATING ROOM/TABLE WITH ID:", gameId);
        // If/once we allow customizing game settings, it'll go here
        knownGameStates[gameId] = initGame(gameId);
        gameState = knownGameStates[gameId];
    }

    if (gameState.round > 0) {
        console.log(`User ${userId} cannot join game ${gameId} already in-progress (round ${gameState.round})`);
        return;
    }

    player = gameState.players.find((p) => {return p.id == userId});

    if (player !== undefined) {
        // Don't try to double-add
        return;
    }

    console.log(`User ${userId} joining game ${gameId}`);
    let newPlayer = initPlayer(userId, gameState.players.length + 1);
    gameState.players.push(newPlayer);
    io.to(userId).emit('playerState', {room: gameId, user: userId, playerState: newPlayer});
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
        } else {
          // file written successfully
          console.log("WROTE GAMESTATE:", gameState.roomId)
        }
    });
}

function letterToElement(letter) {
    if (letter === "a") {
        return "air"
    } else if (letter === "e") {
        return "earth"
    } else if (letter === "f") {
        return "fire"
    } else if (letter === "w") {
        return "water"
    } else {
        return "neutral"
    }
}

function hashCode(string){
    var hash = 0;
    for (var i = 0; i < string.length; i++) {
        var code = string.charCodeAt(i);
        hash = ((hash<<5)-hash)+code;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

function getRandomString(strLen = 7) {
    // This only generates a max of 10-11 char alphanumerical strings
    // (could extend to longer strings by joining multiple such results)
    return Math.random().toString(36).substring(2, strLen+2);
}

function arrContains(arr, val) {
    return arr.some((arrVal) => val === arrVal.id);
}

io.on('connection', (socket) => {
    socket.on("startRoom", (args) => {
        let roomId = args.roomId ? args.roomId : getRandomString(10);
        let userUid = args.userUid ? args.userUid : "";
        if (userUid.length > 0) {
            socket.join(userUid);
        }
        if (roomId.length > 0) {
            socket.join(roomId);
        }
        addPlayerToGame(userUid, roomId);
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
            addPlayerToGame(userId, roomId);
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
        let argsHash = hashCode(JSON.stringify(args) + timeString);
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
            addPlayerToGame(userId, roomId);
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        player.nickname = args.nickname;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player});
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
            addPlayerToGame(userId, roomId);
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        console.log(`⚔️⚔️⚔️  Player ${player.playerIndex} attacking Player ${args.targetPlayerIndex} 🛡️🛡️🛡️`);

        player.attacking = args.targetPlayerIndex;
        gameState.allMoveHistory += `[P${player.playerIndex}:attack(${args.targetPlayerIndex})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player});
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
            addPlayerToGame(userId, roomId);
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        player.order = args.order;

        gameState.allMoveHistory += `[P${player.playerIndex}:reorder(${args.order})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player});
    });

    socket.on("convert", (args) => {
        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            // TODO: we can just `return` here, after gameState saving+loading (for server rebootage) is done
            //return
            knownGameStates[roomId] = initGame(roomId);
            gameState = knownGameStates[roomId]
        }

        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // TODO: we can just `return` here, after gameState saving+loading (for server rebootage) is done
            //return
            // Auto-join for now
            addPlayerToGame(userId, roomId);
        }

        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        if (player.life >= 100) {
            player.life -= 100;
            theElement = args.element;
            if (theElement === "air") {
                player[theElement] += (100 / gameState.airPrice)
            } else if (theElement === "earth") {
                player[theElement] += (100 / gameState.earthPrice)
            } else if (theElement === "fire") {
                player[theElement] += (100 / gameState.firePrice)
            } else if (theElement === "water") {
                player[theElement] += (100 / gameState.waterPrice)
            }
        }

        gameState.allMoveHistory += `[P${player.playerIndex}:convert(${args.element})]`;

        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player});
    });

    socket.on("castSpell", (args) => {
        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            // TODO: we can just `return` here, after gameState saving+loading (for server rebootage) is done
            //return
            knownGameStates[roomId] = initGame(roomId);
            gameState = knownGameStates[roomId]
        }

        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // TODO: we can just `return` here, after gameState saving+loading (for server rebootage) is done
            //return
            // Auto-join for now
            addPlayerToGame(userId, roomId);
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
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player})
    });

    socket.on("startRoundTimer", (args) => {
        console.log("START RT", args.room);
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
    });

    socket.on("nextRound", (args) => {
        roomId = args.room;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            knownGameStates[roomId] = initGame(roomId);
            gameState = knownGameStates[roomId]
        }
        processRoundAndProceed(roomId);
        console.log(`Manually proceeding to round ${gameState.round} in game ID: ${roomId}`);
    });

    socket.on('disconnect', () => {
        console.log("Disconnected from socket");
    });
});

function combat(attackingArmy, defendingArmy, weather) {
    let attackMultiplier = 1
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

    if (totalAttackScore > totalDefendScore) {
        // Attacker wins
        return {
            "attackRemaining": totalAttackScore - totalDefendScore,
            "defendRemaining": 0
        }
    } else if (totalDefendScore > totalAttackScore) {
        // Defender wins
        return {
            "attackRemaining": 0,
            "defendRemaining": totalDefendScore - totalAttackScore
        }
    } else {
        return {
            "attackRemaining": 0,
            "defendRemaining": 0
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

function generateMarket() {
    let rawAirRNG = getRandomInt(100);
    let rawEarthRNG = getRandomInt(100);
    let rawFireRNG = getRandomInt(100);
    let rawWaterRNG = getRandomInt(100);
    let rawTotal = rawAirRNG + rawEarthRNG + rawFireRNG + rawWaterRNG;

    return {
        airPrice: rawAirRNG / rawTotal,
        earthPrice: rawEarthRNG / rawTotal,
        firePrice: rawFireRNG / rawTotal,
        waterPrice: rawWaterRNG / rawTotal
    }
}

function generateNeighborhood(gameState, playerIndex) {
    let totalPlayerCount = gameState.players.length;

    let maxNeighborhoodSize = 1;

    console.log("TOTALPLAYERS:", totalPlayerCount);

    if (totalPlayerCount < 2) {
        return;
    } else if (totalPlayerCount > 2 && totalPlayerCount < 4) {
        maxNeighborhoodSize = 2;
    } else if (totalPlayerCount >= 4 && totalPlayerCount < 8) {
        maxNeighborhoodSize = 3;
    } else if (totalPlayerCount >= 8) {
        maxNeighborhoodSize = 4;
    }

    console.log("maxNeighborhoodSize:", maxNeighborhoodSize);

    // TODO: skew more towards 2-3 than towards 1 or 4
    let neighborhoodSize = getRandomInt(maxNeighborhoodSize);

    let neighborhood = [];
    let neighborhoodIndices = [];

    let i = 0; 
    
    while (i < neighborhoodSize) {
        let candidateNeighbor = getRandomInt(totalPlayerCount);
        // TODO: fix this indexOf because the visibleNeighborDetails isn't just a number anymore
        if (candidateNeighbor !== playerIndex && neighborhoodIndices.indexOf(candidateNeighbor) == -1) {
            console.log("CAND NEIGH:", candidateNeighbor);
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
        let troopType = letterToElement(player.order.charAt(c));
        if (player[troopType] > 0) {
            return {troopType: troopType, amount: player[troopType]}
        }
    }
            
    return {troopType: "none", amount: 0}
}

function processRoundAndProceed(roomId) {
    gameState = knownGameStates[roomId];

    if (gameState.round >= gameState.roundCount) {
        console.log(`Game ${roomId} complete; balancing market and allocating winnings`);
        gameState.isTicking = false;
        gameState.airPrice = 0.25
        gameState.earthPrice = 0.25
        gameState.firePrice = 0.25
        gameState.waterPrice = 0.25
        allocateWinnings(gameState);
        io.to(roomId).emit('gameResults', gameState);
        return;
    }

    console.log(`Game ${roomId} PROCESSING ROUND ${gameState.round} AND PROCEEDING`);
    let playerTurns = [...Array(gameState.players.length).keys()];
    shuffle(playerTurns);
    console.log("PLAYER TURNS:", playerTurns);

    for (turn of playerTurns) {
        playingPlayer = gameState.players[turn];
        console.log("TURN", turn);
        console.log("PLAYING PLAYER:", playingPlayer);
        if (playingPlayer.attacking > 0) {
            let defendingPlayer = getPlayerByPlayerIndex(gameState, playingPlayer.attacking);
            if (defendingPlayer.id === playingPlayer.id) {
                // Can't attack yourself, silly
                continue;
            }

            gameState.allMoveHistory += `[P${player.playerIndex}:attack(${playingPlayer.attacking})]`;

            // Execute attack
            console.log(`Player ${playingPlayer.playerIndex} (${playingPlayer.nickname}) ATTACKING THE DEFENDER: ${defendingPlayer.playerIndex} (${defendingPlayer.nickname})`);
            let attackingStrengthAndType = topTroops(playingPlayer, "attack");
            let defendingStrengthAndType = topTroops(defendingPlayer, "defend");
            while (attackingStrengthAndType.amount > 0 && defendingStrengthAndType.amount > 0) {
                battleResults = combat({size: attackingStrengthAndType.amount, element: attackingStrengthAndType.troopType}, {size: defendingStrengthAndType.amount, element: defendingStrengthAndType.troopType}, gameState.weather);
                
                playingPlayer[attackingStrengthAndType.troopType] = battleResults.attackRemaining;
                defendingPlayer[defendingStrengthAndType.troopType] = battleResults.defendRemaining;

                let timeString = new Date().getTime().toString();
                let battleResultsHash = hashCode(JSON.stringify(battleResults) + timeString);
                io.to(roomId).emit('newMessage', {room: roomId, text: JSON.stringify(battleResults), user: "SYSTEM", color: "BLACK", id: battleResultsHash, key: battleResultsHash});
                attackingStrengthAndType = topTroops(playingPlayer, "attack");
                defendingStrengthAndType = topTroops(defendingPlayer, "defend");
            }

            if (attackingStrengthAndType.amount > 0) {
                console.log("ATTACKER WINS!");
                let totalLooters = playingPlayer.empower + playingPlayer.air + playingPlayer.earth + playingPlayer.fire + playingPlayer.water;
                let lootableValue = Math.min(totalLooters, defendingPlayer.life);
                defendingPlayer.life -= lootableValue;
                playingPlayer.life += lootableValue;
                console.log("LOOTED LIFE:", lootableValue);
            } else if (defendingStrengthAndType.amount > 0) {
                console.log("DEFENDER WINS!");
            } else {
                console.log("MUTUAL DESTRUCTION!");
            }
        }
    }

    // Now double everyone's life and alert them of playerState changes
    for (const player of gameState.players) {
        player.life = player.life * 2;
        player.attacking = "";
        player.isScrying = false;
        generateNeighborhood(gameState, player.playerIndex);
        io.to(player.id).emit('playerState', {room: roomId, user: player.id, playerState: player});
    }

    gameState.weather = generateWeather();
    let newPrices = generateMarket();
    gameState.airPrice = newPrices.airPrice;
    gameState.earthPrice = newPrices.earthPrice;
    gameState.firePrice = newPrices.firePrice;
    gameState.waterPrice = newPrices.waterPrice;
    gameState.round = gameState.round + 1;
    saveGameState(gameState);
    io.to(roomId).emit('newRound', {
        round: gameState.round,
        weather: gameState.weather,
        airPrice: gameState.airPrice,
        earthPrice: gameState.earthPrice,
        firePrice: gameState.firePrice,
        waterPrice: gameState.waterPrice,
    });
}

setInterval(() => {
    for (const [roomId, gameState] of Object.entries(knownGameStates)) {
        if (gameState.isTicking) {
            console.log(`Ticking and proceedings to round ${gameState.round} in game ID: ${roomId}`);
            processRoundAndProceed(roomId)
        }
    }
}, 10000)

server.listen(5001, () => {
    console.log('listening on *:5001');
});