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

let gameState = {
    isStarted: false,
    roomId: "abcdef",
    round: 0,
    players: [],
    potSize: 80.00,
    roundDuration: 30
};

let gameStates = {
    "abcdef": {
        isStarted: false,
        roomId: "abcdef",
        round: 0,
        players: [],
        potSize: 80.00,
        roundDuration: 30
    }
}

function arrContains(arr, val) {
    return arr.some((arrVal) => val === arrVal.id);
}

io.on('connection', (socket) => {
    socket.join(gameState.roomId);
    socket.on("startRoom", (args) => {
        console.log("STARTING:", args);
        socket.join(args.roomId);
    });

    socket.on("submit", (args) => {
        if (args.userUid) {
            let userExists = arrContains(gameState.players, args.userUid);

            if (!userExists) {
                gameState.players.push({
                    id: args.userUid,
                    lastSpellCastInRound: 0,
                    life: 2000,
                    air: 0,
                    earth: 0,
                    fire: 0,
                    water: 0
                });
            }
        }

        io.to(args.roomId).emit('foo', {text: args.text, user: args.userName, id: "1245"})

        console.log("UUID:", args.userUid);
        console.log(`NEW GAME STATE: ${util.inspect(gameState, false, null, true)}`);
        //socket.to(gameState.roomId).emit("foo", {text: "Hi!!!", user: "no one2", id: "1245", key: "fhfdsa3"})
        //socket.emit('foo', {text: "Hi!!!", user: "no one2", id: "1245", key: "fhfdsa3"})
        //io.to(gameState.roomId).emit('foo', {text: "Hi!!!", user: "no one2", id: "1245", key: "fhfdsa3"})
        io.to(gameState.roomId).emit('newRound', {round: gameState.round})
    });

    socket.on("startRoundTimer", () => {
        gameState.isStarted = true;
        console.log("BEGINNING TIMER:", gameState.roomId);
        io.to(gameState.roomId).emit('autoProceed')
    });

    socket.on("nextRound", () => {
        gameState.round = gameState.round + 1;
        io.to(gameState.roomId).emit('newRound', {round: gameState.round})
    });

    socket.on('disconnect', () => {
        console.log("Disconnected from socket");
    });
});

setInterval(() => {
    if (gameState.isStarted) {
        gameState.round = gameState.round + 1;
        io.to(gameState.roomId).emit('newRound', {round: gameState.round})
    }
}, 25000)

server.listen(5001, () => {
    console.log('listening on *:5001');
});