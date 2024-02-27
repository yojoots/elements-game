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

io.on('connection', (socket) => {
    socket.on("submit", (args) => {
        console.log(`SUBMIT ARGS: ${util.inspect(args, false, null, true /* enable colors */)}`);

    });

    socket.on('disconnect', () => {
        console.log("Disconnected from socket");
    });
});

// setInterval(() => {
//     //console.log(`GAME: ${util.inspect(game, false, null, true /* enable colors */)}`);
//     //io.emit("gameState", game)
//     io.emit("gameState", game.moves); //)
// }, 30000)

server.listen(5001, () => {
    console.log('listening on *:5001');
});