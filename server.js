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
        if (!knownGameStates[roomId]) {
            console.log("CREATING ROOM/TABLE WITH ID:", roomId);
            // If/once we allow customizing game settings, it'll go here
            knownGameStates[roomId] = structuredClone(defaultGameState);

            console.log("JOINING ROOM SOCKET WITH ID:", roomId);
        }
        socket.join(roomId);
        socket.to(roomId).emit("foo", "whassup")
        socket.emit("foo", "whassup")
    });

    socket.on("submit", (args) => {
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

        io.to(userId).emit('newRound', {round: gameState.round})
    });

    socket.on("startRoundTimer", (roomId) => {
        console.log("SRT", roomId);
        let gameState = knownGameStates[roomId.room];
        if (gameState === undefined) {
            return
        }
        gameState.isStarted = true;
        console.log("BEGINNING TIMERz:", roomId.room);
        io.to(roomId).emit('autoProceed');
        socket.to(roomId).emit('autoProceed');
    });

    socket.on("nextRound", (roomId) => {
        let gameState = knownGameStates[roomId];
        if (gameState === undefined) {
            return
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