import React, { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { Toolbar } from "./components/Toolbar";
import { Auth } from "./components/Auth";
import { AppWrapper } from "./components/AppWrapper";
import Cookies from "universal-cookie";
import "./App.css";
import io from 'socket.io-client';
import { auth } from "./firebase-config";

const cookies = new Cookies();
const socket = io.connect('http://localhost:5001');

function ChatApp() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const queryParameters = new URLSearchParams(window.location.search);
  const queryParamRoom = queryParameters.get("room");
  const [room, setRoom] = useState(queryParamRoom || "");
  const [isInChat, setIsInChat] = useState(queryParamRoom);

  if (!isAuth) {
    return (
      <AppWrapper
        isAuth={isAuth}
        setIsAuth={setIsAuth}
        setIsInChat={setIsInChat}
      >
        <Auth setIsAuth={setIsAuth} />
      </AppWrapper>
    );
  }

  function tryToJoin() {
    if (room === "") {
      let randomRoomId = (Math.random() + 1).toString(36).substring(7);

      setRoom(randomRoomId);
    }
    setIsInChat(true);
  }

  return (
    <AppWrapper isAuth={isAuth} setIsAuth={setIsAuth} setIsInChat={setIsInChat}>
      {!isInChat ? (
        <div className="room">
          <label> Game ID: </label>
          <input onKeyDown={(e) => { if (e.key === 'Enter') { tryToJoin() }
          }} onChange={(e) => setRoom(e.target.value)} />
          <button
            onClick={tryToJoin}
          >
            Join
          </button>
        </div>
      ) : (
        auth.currentUser != null ?
        <>
          <Dashboard room={room} socket={socket} currentUser={auth.currentUser} />
          <Toolbar room={room} socket={socket} />
        </> :
          <Auth setIsAuth={setIsAuth} />
      )}
    </AppWrapper>
  );
}

export default ChatApp;
