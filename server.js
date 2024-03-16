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

const initPlayer = (userId) => {
    return {
        id: userId,
        nickname: userId,
        color: stringToColour(userId),
        lastSpellCastInRound: -1,
        isScrying: false,
        life: 2000,
        air: 0,
        earth: 0,
        fire: 0,
        water: 0,
        empower: 0,
        fortify: 0
    }
}

const initGame = (roomId) => {
    return {
        isTicking: false,
        roomId: roomId,
        round: 0,
        players: [],
        maxPlayers: 10,
        potSize: 80.00,
        roundDuration: 30
    }
}

const defaultGameState = {
    isTicking: false,
    roomId: "default",
    round: 0,
    players: [],
    maxPlayers: 10,
    potSize: 80.00,
    roundDuration: 30
};

let knownGameStates = {
    "default": structuredClone(defaultGameState)
}

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
        if (!knownGameStates[roomId]) {
            console.log("CREATING ROOM/TABLE WITH ID:", roomId);
            // If/once we allow customizing game settings, it'll go here
            knownGameStates[roomId] = initGame(roomId);

            console.log("JOINING ROOM SOCKET WITH ID:", roomId);
        }
        // socket.join(roomId);
        // socket.to(roomId).emit("foo", "whassup")
        // socket.emit("foo", "whassup")
    });

    socket.on("submit", (args) => {
        console.log("GOT SUBMISSION WITH ARGUS:", args);

        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        console.log("GAME STATE:", gameState);
        if (gameState === undefined) {
            return
        }
        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // Auto-join for now (if still in round 0)
            gameState.players.push(initPlayer(userId));
        }

        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        //io.to(roomId).emit('newRound', {round: gameState.round})
        //io.to(userId).emit('foo', {room: roomId, text: args.text, user: userId, id: args.userName + args.text, key: args.userName + args.text})
        let timeString = new Date().getTime().toString();
        let argsHash = hashCode(JSON.stringify(args) + timeString);
        io.to(roomId).emit('newMessage', {room: roomId, text: args.text, user: player.nickname, color: player.color, id: argsHash, key: argsHash})
    });

    socket.on("updateNickname", (args) => {
        console.log("GOT NICKNAME WITH ARGUS:", args);

        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        console.log("GAME STATE:", gameState);
        if (gameState === undefined) {
            return
        }
        let userExists = arrContains(gameState.players, userId);

        if (!userExists && gameState.round === 0) {
            // Auto-join for now
            gameState.players.push(initPlayer(userId));
        }
        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        player.nickname = args.nickname;

        //io.to(roomId).emit('setNickname', {room: roomId, nickname: player.nickname, user: userId})
        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player});
    });

    socket.on("convert", (args) => {
        console.log("CONVERT: ARGS::", args);

        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        console.log("GAME STATE:", gameState);
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
            gameState.players.push(initPlayer(userId));
        }

        player = gameState.players.find((p) => {return p.id == userId});

        if (player == undefined) {
            return;
        }

        if (player.life >= 100) {
            player.life -= 100;
            theElement = args.element;
            player[theElement] += 400;
            // io.to(userId).emit('foo', {room: roomId, text: "JUST CONVERTED SOME " + theElement, user: userId, id: args.userName, key: args.userName})
        }
        saveGameState(gameState);
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player});
    });

    socket.on("castSpell", (args) => {
        console.log("CAST SPELL: ARGS::", args);

        if (!(args.roomId && args.userUid)) {
            return
        }
        let roomId = args.roomId;
        let userId = args.userUid;
        let gameState = knownGameStates[roomId];
        console.log("GAME STATE:", gameState);
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
            gameState.players.push(initPlayer(userId));
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
        console.log("BEGINNING TIMERz:", args.room);
        io.to(args.room).emit('autoProceed');
        socket.to(args.room).emit('autoProceed');
    });

    socket.on("stopRoundTimer", (args) => {
        console.log("STOP RT", args);
        let gameState = knownGameStates[args.room];
        if (gameState === undefined) {
            return
        }
        gameState.isTicking = false;
        console.log("STOPPING TIMERz:", args.room);
    });

    socket.on("nextRound", (args) => {
        roomId = args.room;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            knownGameStates[roomId] = initGame(roomId);
            gameState = knownGameStates[roomId]
        }
        gameState.round = gameState.round + 1;
        console.log(`Manually proceeding to round ${gameState.round} in game ID: ${roomId}`);
        io.to(roomId).emit('newRound', {round: gameState.round})
    });

    socket.on('disconnect', () => {
        console.log("Disconnected from socket");
    });
});

setInterval(() => {
    for (const [roomId, gameState] of Object.entries(knownGameStates)) {
        if (gameState.isTicking) {
            gameState.round = gameState.round + 1;
            console.log(`Ticking and proceedings to round ${gameState.round} in game ID: ${roomId}`);
            io.to(roomId).emit('newRound', {round: gameState.round});
            io.sockets.to(roomId).emit('newRound', {round: gameState.round});
        }
    }
}, 10000)

server.listen(5001, () => {
    console.log('listening on *:5001');
});