# Elements Game

## 🌱 💨 ⛰️ 🔥 💧

The front-end (client) is a React app. The back-end (server) is a minimal express server.

## Running

First, set things up by copying the `.env.example` file in the client folder to `.env` and making sure real Firebase credentials/settings are included in it. After this has been done, you can run the front-end client:

```bash
npm run client
```

This will run the client in development mode.

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.

You may also see any lint errors in the console.

To run the server after its `.env` file has been readied:

```bash
npm run start
```

This runs the server (on port 5001 by default).

It must be running for the client(s) to work, as it manages game states and the clients need to connect to it (via websockets) to do anything.

`npm run build` will build the (client) app for production to the `build` folder.

It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.

## Deploying

To deploy the front-end with Netlify:

```bash
npm run deploy
```

To deploy the back-end with Heroku:

```bash
git push heroku master
```

## Saving Gamestates to Local Drive

```bash
heroku ps:copy server/games/GAME_ID.txt
```

## TODO

- [ ] Bots
- [ ] Custom rule engine swapping
- [ ] First to a game is rulesetter (form)
    - [] Show settings to other joining players
- [ ] Better animations
- [ ] Log reader
