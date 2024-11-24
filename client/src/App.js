import React, { useState, useEffect } from "react";
import { Dashboard } from "./components/Dashboard";
import { Toolbar } from "./components/Toolbar";
import { Auth } from "./components/Auth";
import { AppWrapper } from "./components/AppWrapper";
import Cookies from "universal-cookie";
import "./App.css";
import io from 'socket.io-client';
import { auth } from "./firebase-config";
import { onAuthStateChanged, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import 'font-awesome/css/font-awesome.min.css';

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

  // Get room from either path or query parameter
  const getRoomFromUrl = () => {
    const queryParameters = new URLSearchParams(window.location.search);
    const queryParamRoom = queryParameters.get("room");

    // Check if there's a path-based room ID (e.g., /EXAMPLE)
    const pathSegments = window.location.pathname.split('/');
    const pathRoom = pathSegments[1]; // Get the first segment after the '/'

    // Return the room ID from either source, prioritizing path-based
    return pathRoom || queryParamRoom || "";
  };

  const [room, setRoom] = useState(getRoomFromUrl());
  const [isInChat, setIsInChat] = useState(!!getRoomFromUrl());

  useEffect(() => {
    // First, check for stored auth token
    const authToken = cookies.get("auth-token");

    // If we have a token but aren't authenticated, try to restore the session
    if (authToken && !isAuth) {
      // Create a credential from the stored token
      const credential = GoogleAuthProvider.credential(null, authToken);

      // Attempt to sign in with the stored credential
      signInWithCredential(auth, credential)
        .catch((error) => {
          console.error("Error restoring auth session:", error);
          // If token is invalid, clear it
          cookies.remove("auth-token");
          setIsAuth(false);
          setLoading(false);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setIsAuth(true);
        // Update the cookie with the latest token
        cookies.set("auth-token", user.refreshToken, {
          path: '/',
          sameSite: 'strict',
          secure: window.location.protocol === 'https:',
          maxAge: 3600 * 24 * 30 // 30 days
        });
      } else {
        // User is signed out
        setIsAuth(false);
        cookies.remove("auth-token");
      }
      setLoading(false);
    });

    // Handle browser back/forward navigation
    const handleLocationChange = () => {
      const newRoom = getRoomFromUrl();
      setRoom(newRoom);
      setIsInChat(!!newRoom);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleLocationChange);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribe();
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [isAuth]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Rest of the component remains the same...
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
      // Update the URL without reloading the page
      window.history.pushState({}, '', `/${randomRoomId}`);
    } else {
      // Update the URL without reloading the page
      window.history.pushState({}, '', `/${room}`);
    }
    setIsInChat(true);
  }

  return (
    <AppWrapper isAuth={isAuth} setIsAuth={setIsAuth} setIsInChat={setIsInChat}>
      {!isInChat ? (
        <div className="room">
          <label className="text-white"> Game ID: </label>
          <input
            value={room}
            placeholder="(leave blank to auto-generate)"
            onKeyDown={(e) => { if (e.key === 'Enter') { tryToJoin() }}}
            onChange={(e) => { setRoom(e.target.value); }}
          />
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
          <Dashboard room={room} socket={socket} currentUser={auth.currentUser} isAuth={isAuth} setIsAuth={setIsAuth} setIsInChat={setIsInChat} />
          <Toolbar room={room} socket={socket} />
        </> :
          <Auth setIsAuth={setIsAuth} />
      )}
    </AppWrapper>
  );
}

export default ElementsApp;