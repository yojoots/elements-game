import React, { useState, useEffect } from "react";
import {
  serverTimestamp,
} from "firebase/firestore";

import "../styles/Dashboard.css";

export const Dashboard = ({ room, socket, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [roundNumber, setRoundNumber] = useState(0);
  const [isJoined, setIsJoined] = useState(false);
  const [roundWeather, setRoundWeather] = useState("Clear");
  const [lifeScore, setLifeScore] = useState(2000);
  const [airScore, setAirScore] = useState(0);
  const [earthScore, setEarthScore] = useState(0);
  const [fireScore, setFireScore] = useState(0);
  const [waterScore, setWaterScore] = useState(0);
  const [canCastSpell, setCanCastSpell] = useState(true);

  //console.log("SOCKET:", socket);

  // const messagesRef = collection(db, "messages");

  // useEffect(() => {
  //   const queryMessages = query(
  //     messagesRef,
  //     where("room", "==", room),
  //     orderBy("createdAt")
  //   );
  //   const unsubscribe = onSnapshot(queryMessages, (snapshot) => {
  //     let messages = [];
  //     snapshot.forEach((doc) => {
  //       messages.push({ ...doc.data(), id: doc.id });
  //     });
  //     console.log(messages);
  //     console.log("WE UNSUBD");
  //     setMessages(messages);
  //   });

  //   return () => unsubscribe();
  // }, []);

  // function onGameStateChange(value) {
  //   setMessages(messages => [...messages, value]);
  // }

  if (!isJoined) {
    socket.emit("startRoom", {
      userUid: currentUser.uid,
      roomId: room,
      room,
    })
    setIsJoined(true);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newMessage === "") return;

    socket.emit("submit", {
        text: newMessage,
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        userName: currentUser.displayName,
        roomId: room,
        //fullUser: auth.currentUser,
        room,
      })

    setNewMessage("");
  };

  useEffect(() => {
    socket.on("connection", (room) => {
      socket.join(room);
    });

    function onNewMessage(value) {
      console.log("GOT NEW MESSAGE:", value);
      if (value.room == room) {
        setMessages(messages => [...messages, value]);
      }
    }

    function onPlayerState(value) {
      //console.log("GOT NEW PLAYERSTATE:", value);
      if (value.room === room && value.user === currentUser.uid) {
        setAirScore(value.playerState.air);
        setEarthScore(value.playerState.earth);
        setFireScore(value.playerState.fire);
        setWaterScore(value.playerState.water);
        setLifeScore(value.playerState.life);
      }
    }

    function onNewRound(value) {
      setRoundNumber(value.round);
    }

    socket.on('foo', onNewMessage);
    socket.on('playerState', onPlayerState);
    socket.on('newRound', onNewRound);

    return () => {
      socket.off('foo', onNewMessage);
    };
  }, [socket]);

  const convertLifeTo = async (elementToGet, event) => {
    event.preventDefault();

    socket.emit("convert", {
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        roomId: room,
        element: elementToGet
      });
  };

  return (
    <>
      <div className="dashboard-app">
        <div className="header">
          <h1>Game: {room || "Game"}</h1>
          <h3>Round: {roundNumber}</h3>
          <div className="weather">Weather: {roundWeather}</div>
        </div>
        <div className="messages">
          {/*messages.map((message) => (
            <div key={message.id} className="message">
              <span className="user">{message.user}:</span> {message.text}
            </div>
          ))*/}
          <h3 className="pl-1">Player: {currentUser.displayName} <small title={currentUser.uid}>({currentUser.uid.slice(0,4) + "..." + currentUser.uid.slice(-5,-1)})</small><small> {isJoined ? "🟢" : "🔴"}</small></h3>
          <div className="life-score">
            <div className="life-emoji">🌱</div>
            <div>{Math.round(lifeScore / 100)}</div>
          </div>
          <div className="element-buttons">
            <div>
              <div>{Math.round(fireScore / 100)}</div>
              <button onClick={(e) => convertLifeTo("fire", e)}>🔥</button>
            </div>
            <div>
              <div>{Math.round(waterScore / 100)}</div>
              <button onClick={(e) => convertLifeTo("water", e)}>💧</button>
            </div>
            <div>
              <div>{Math.round(earthScore / 100)}</div>
              <button onClick={(e) => convertLifeTo("earth", e)}>⛰️</button>
            </div>
            <div>
              <div>{Math.round(airScore / 100)}</div>
              <button onClick={(e) => convertLifeTo("air", e)}>🌪️</button>
            </div>
          </div>
          <div className="element-buttons">
            { airScore > 0 && earthScore > 0 && fireScore > 0 &&
            (<div>
              <div className={canCastSpell ? "text-black" : "text-gray"}>Scry</div>
              <button disabled={!canCastSpell} onClick={(e) => convertLifeTo("fire", e)}>👁️</button>
            </div>)
            }
            { airScore > 0 && fireScore > 0 && waterScore > 0 &&
              <div>
                <div className={canCastSpell ? "text-black" : "text-gray"}>Empower</div>
                <button disabled={!canCastSpell} onClick={(e) => convertLifeTo("water", e)}>⚔️</button>
              </div>
            }
            { waterScore > 0 && earthScore > 0 && fireScore > 0 &&
              <div>
                <div className={canCastSpell ? "text-black" : "text-gray"}>Fortify</div>
                <button disabled={!canCastSpell} onClick={(e) => convertLifeTo("earth", e)}>🛡️</button>
              </div>
            }
            { airScore > 0 && earthScore > 0 && waterScore > 0 &&
              <div>
                <div className={canCastSpell ? "text-black" : "text-gray"}>Seed</div>
                <button disabled={!canCastSpell} onClick={(e) => convertLifeTo("air", e)}>🌿</button>
              </div>
            }
          </div>
        </div>
        <form onSubmit={handleSubmit} className="new-message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            className="new-message-input"
            placeholder="Enter chat here..."
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
      </div>
    </>
  );
};
