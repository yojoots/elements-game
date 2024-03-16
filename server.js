const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const util = require('util')

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000"
    }
});

const defaultGameState = {
    isStarted: false,
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
            knownGameStates[roomId] = structuredClone(defaultGameState);

            console.log("JOINING ROOM SOCKET WITH ID:", roomId);
        }
        // socket.join(roomId);
        socket.to(roomId).emit("foo", "whassup")
        socket.emit("foo", "whassup")
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

        if (!userExists) {
            // Auto-join for now
            gameState.players.push({
                id: userId,
                lastSpellCastInRound: 0,
                life: 2000,
                air: 0,
                earth: 0,
                fire: 0,
                water: 0
            });
        }
        //io.to(roomId).emit('newRound', {round: gameState.round})
        //io.to(userId).emit('foo', {room: roomId, text: args.text, user: userId, id: args.userName + args.text, key: args.userName + args.text})
        io.to(roomId).emit('foo', {room: roomId, text: args.text, user: userId, id: args.userName + args.text, key: args.userName + args.text})
    });

    socket.on("convert", (args) => {
        console.log("CONVERT< ARGS::", args);

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
            knownGameStates[roomId] = structuredClone(defaultGameState);
            gameState = knownGameStates[roomId]
        }

        let userExists = arrContains(gameState.players, userId);

        if (!userExists) {
            // TODO: we can just `return` here, after gameState saving+loading (for server rebootage) is done
            //return
            // Auto-join for now
            gameState.players.push({
                id: userId,
                lastSpellCastInRound: 0,
                life: 2000,
                air: 0,
                earth: 0,
                fire: 0,
                water: 0
            });
        }

        player = gameState.players.find((p) => {return p.id == userId});
        if (player.life >= 100) {
            player.life -= 100;
            theElement = args.element;
            player[theElement] += 400;
            io.to(userId).emit('foo', {room: roomId, text: "JUST CONVERTED SOME " + theElement, user: userId, id: args.userName, key: args.userName})
        }
        io.to(userId).emit('playerState', {room: roomId, user: userId, playerState: player})
    });

    socket.on("startRoundTimer", (args) => {
        console.log("START RT", args.room);
        let gameState = knownGameStates[args.room];
        if (gameState === undefined) {
            return
        }
        gameState.isStarted = true;
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
        gameState.isStarted = false;
        console.log("STOPPING TIMERz:", args.room);
    });

    socket.on("nextRound", (args) => {
        roomId = args.room;
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            knownGameStates[roomId] = structuredClone(defaultGameState);
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
        if (gameState.isStarted) {
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