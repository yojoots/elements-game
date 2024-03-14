import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase-config";
import {
  collection,
  addDoc,
  where,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { Toolbar } from "./Toolbar";

import "../styles/Chat.css";

export const Chat = ({ room, socket }) => {
  const [messages, setMessages] = useState([{text: "Hi", user: "no one", id: "124", key: "fhfdsa"}]);
  const [newMessage, setNewMessage] = useState("");
  const [roundNumber, setRoundNumber] = useState(0);
  const [isAutoProceeding, setIsAutoProceeding] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

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
      userUid: auth.currentUser.uid,
      roomId: room,
      room,
    })
    setIsJoined(true);
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newMessage === "") return;
    // await addDoc(messagesRef, {
    //   text: newMessage,
    //   createdAt: serverTimestamp(),
    //   user: auth.currentUser.displayName + ":" + auth.currentUser.uid,
    //   room,
    // });

    socket.emit("submit", {
        text: newMessage,
        createdAt: serverTimestamp(),
        userUid: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        roomId: room,
        //fullUser: auth.currentUser,
        room,
      })

    setNewMessage("");
  };

  useEffect(() => {
    // function onFooEvent(value) {
    //   setFooEvents(previous => [...previous, value]);
    // }
    //socketio.connect();
    //socketio.join(room)

    //socketio.connect({ query: `userId=${auth.currentUser.uid}` });

    socket.on("connection", (room) => {
      console.log("SOCK CONNECT", room);
      socket.join(room);
    });

    function onNewMessage(value) {
      console.log("GOT NEW MESSAGE:", value);
      if (value.room == room) {
        setMessages(messages => [...messages, value]);
      }
    }

    function onAutoProceed() {
      console.log("autoProceeding NOW");
      setIsAutoProceeding(true);
    }

    function onNewRound(value) {
      console.log("ON NEW ROUND:", value);
      setRoundNumber(value.round);
    }

    socket.on('foo', onNewMessage);
    socket.on('newRound', onNewRound);
    socket.on('autoProceed', onAutoProceed);

    return () => {
      socket.off('foo', onNewMessage);
    };
  }, [socket]);


  return (
    <>
      <div className="chat-app">
        <div className="header">
          <h1>Welcome to {room || "Game"} Lobby</h1>
          <h3>Round: {roundNumber}</h3>
        </div>
        <div className="messages">
          {messages.map((message) => (
            <div key={message.id} className="message">
              <span className="user">{message.user}:</span> {message.text}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="new-message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            className="new-message-input"
            placeholder="Type your message here..."
          />
          <button type="submit" className="send-button">
            Send
          </button>
        </form>
      </div>
      <Toolbar room={room} isAutoProceeding={isAutoProceeding} />
    </>
  );
};
