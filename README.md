# Elements Game

## 🌱 💨 ⛰️ 🔥 💧

The front-end (client) is a React app. The back-end (server) is a minimal express server.

## Running

To run the front-end client:

```bash
npm start
```

This runs the client in development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.

You may also see any lint errors in the console.

To run the server:

```bash
node server.js
```

This runs the server on port 5001.

It must be running for the client(s) to work, as it manages game states and the clients need to connect to it (via websockets) to do anything.

`npm run build` will build the (client) app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

## TODO

- [ ] Custom rule engine swapping
- [ ] Admin (or automatic) game cleanup
- [ ] Better animations
- [ ] Log reader
- [ ] Deploy to website
