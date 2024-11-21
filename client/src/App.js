import React, { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { Toolbar } from "./components/Toolbar";
import { Auth } from "./components/Auth";
import { AppWrapper } from "./components/AppWrapper";
import Cookies from "universal-cookie";
import "./App.css";
import io from 'socket.io-client';
import { auth } from "./firebase-config";
import { onAuthStateChanged } from "firebase/auth";

const cookies = new Cookies();
const socket = io.connect(process.env.REACT_APP_SOCKET_SERVER, {
  withCredentials: true,
  transportOptions: {
    polling: {
      extraHeaders: {
        "my-custom-header": "abcd"
      }
    }
  }
});

function ElementsApp() {
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const queryParameters = new URLSearchParams(window.location.search);
  const queryParamRoom = queryParameters.get("room");
  const [room, setRoom] = useState(queryParamRoom || "");
  const [isInChat, setIsInChat] = useState(queryParamRoom);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setIsAuth(true);
        cookies.set("auth-token", user.refreshToken);
      } else {
        // User is signed out
        setIsAuth(false);
        cookies.remove("auth-token");
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Or your preferred loading indicator
  }

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
            className="auth-button"
            onClick={tryToJoin}
          >
            Join / Create
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

export default ElementsApp;