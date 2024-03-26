import React, { useState, useEffect } from "react";
import { Draggable } from "../lib";
import {
  serverTimestamp,
} from "firebase/firestore";

import "../styles/Dashboard.css";

export const Dashboard = ({ room, socket, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [nickname, setNickname] = useState("Nickname");
  const [roundNumber, setRoundNumber] = useState(0);
  const [isJoined, setIsJoined] = useState(false);
  const [gameIsOver, setGameIsOver] = useState(false);
  const [roundWeather, setRoundWeather] = useState("Clear");
  const [neighborhood, setNeighborhood] = useState([]);
  const [attacking, setAttacking] = useState(0);
  const [elementOrder, setElementOrder] = useState("aefw");
  const [airPrice, setAirPrice] = useState(0.25);
  const [earthPrice, setEarthPrice] = useState(0.25);
  const [firePrice, setFirePrice] = useState(0.25);
  const [waterPrice, setWaterPrice] = useState(0.25);
  const [finalWinnings, setFinalWinnings] = useState(0.00);
  const [fullWinningsStats, setFullWinningsStats] = useState([]);
  const [lifeScore, setLifeScore] = useState(2000);
  const [airScore, setAirScore] = useState(0);
  const [earthScore, setEarthScore] = useState(0);
  const [fireScore, setFireScore] = useState(0);
  const [waterScore, setWaterScore] = useState(0);
  const [empowerScore, setEmpowerScore] = useState(0);
  const [fortifyScore, setFortifyScore] = useState(0);
  const [lastSpellCastInRound, setLastSpellCastInRound] = useState(-1);
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

  let USDollar = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  if (!isJoined) {
    socket.emit("joinRoom", {
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

  const handleNicknameChange = async (event) => {
    event.preventDefault();

    if (nicknameInput === "") return;

    socket.emit("updateNickname", {
        nickname: nicknameInput,
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        userName: currentUser.displayName,
        roomId: room,
        //fullUser: auth.currentUser,
        room,
      })

  };


  const queueAttack = async (event, targetPlayerIndex) => {
    if (targetPlayerIndex < 0) return;

    if (event.target.classList.contains("queued")) return;

    socket.emit("queueAttack", {
        targetPlayerIndex: targetPlayerIndex,
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        roomId: room
      })

    setAttacking(targetPlayerIndex);
  };

  const [shiftHeld, setShiftHeld] = useState(false);


  function downHandler({key}) {
    if (key === 'Shift') {
      setShiftHeld(true);
    }
  }

  function upHandler({key}) {
    if (key === 'Shift') {
      setShiftHeld(false);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, []);

  useEffect(() => {
    socket.on("connection", (room) => {
      socket.join(room);
    });

    function onNewMessage(value) {
      if (value.room === room) {
        setMessages(messages => [...messages, value]);
      }
    }

    const onPlayerState = (value) => {
      if (value.room === room && value.user === currentUser.uid) {
        setNickname(value.playerState.nickname);
        setAirScore(value.playerState.air);
        setEarthScore(value.playerState.earth);
        setFireScore(value.playerState.fire);
        setWaterScore(value.playerState.water);
        setLifeScore(value.playerState.life);
        setFortifyScore(value.playerState.fortify);
        setEmpowerScore(value.playerState.empower);
        setNeighborhood(value.playerState.neighborhood);
        setAttacking(value.playerState.attacking);
        setLastSpellCastInRound(value.playerState.lastSpellCastInRound);
      }
    }

    const onGameResults = (value) => {
      if (value.roomId === room) {
        let player = value.players.find((p) => {return p.id === currentUser.uid});
        setFinalWinnings(player.winnings);
        let fullWinningsStatistics = value.players.map((p) => {return {playerIndex: p.playerIndex, nickname: p.nickname, winnings: p.winnings};});
        setFullWinningsStats(fullWinningsStatistics);
        setGameIsOver(true);
      }
    }

    function onNewRound(value) {
      setRoundNumber(value.round);
      setRoundWeather(value.weather);
      setAirPrice(value.airPrice);
      setEarthPrice(value.earthPrice);
      setFirePrice(value.firePrice);
      setWaterPrice(value.waterPrice);
      let allQueuedAttacks = document.querySelectorAll(".queued");
      for (let queuedAttack of allQueuedAttacks) {
        queuedAttack.classList.remove("queued");
      }
      setAttacking(0);
    }

    socket.on('newMessage', onNewMessage);
    socket.on('playerState', onPlayerState);
    socket.on('newRound', onNewRound);
    socket.on('gameResults', onGameResults);

    return () => {
      socket.off('newMessage', onNewMessage);
    };
  }, [socket, currentUser.uid, room]);

  const convertLifeTo = async (elementToGet, event) => {
    event.preventDefault();

    let convertAmount = 1;

    if (shiftHeld) {
      convertAmount = 10;
    }

    socket.emit("convert", {
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        roomId: room,
        amount: convertAmount,
        element: elementToGet
      });
  };

  const castSpell = async (spellToCast, event) => {
    event.preventDefault();

    socket.emit("castSpell", {
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        roomId: room,
        spell: spellToCast
      });
  };

  const reorderElements = (orderDivs) => {
    let newOrder = "";

    for (let i = 0; i < 4; i++) {
      let thisLetter = orderDivs[i].props["data-elch"];
      if (thisLetter !== "a" && thisLetter !== "e" && thisLetter !== "f" && thisLetter !== "w") {
        return;
      }
      if (newOrder.indexOf(thisLetter) >= 0) {
        return;
      }
      newOrder += thisLetter;
    }

    socket.emit("updateOrder", {
      order: newOrder,
      createdAt: serverTimestamp(),
      userUid: currentUser.uid,
      userName: currentUser.displayName,
      roomId: room
    });

    setElementOrder(newOrder);
  };

  // Update canCastSpell according to round # and last spell cast round
  useEffect(() => {
    setCanCastSpell(lastSpellCastInRound < roundNumber);
  }, [roundNumber, lastSpellCastInRound])

  if (gameIsOver) {
    return (
      <div className="dashboard-app">
        <div className="header">
          <h2 className="mt-n1">Game: {room || "Game"}</h2>
          <h3>Round: {roundNumber} (COMPLETE)</h3>
        </div>
        <div className="messages">
          <h3 className="pl-1">Player: {nickname.length > 0 ? nickname : currentUser.displayName} <small title={currentUser.uid}>({currentUser.uid.slice(0,4) + "..." + currentUser.uid.slice(-5,-1)})</small><small> {isJoined ? "🟢" : "🔴"}</small></h3>
            <div className="life-score">
              <h4>Final Life Score:</h4>
              <div className="life-emoji">🌱</div>
              <div>{Math.round(lifeScore / 100)}</div>
              <br />
              <h4>Your Winnings:</h4>
              <div className="life-emoji">💰</div>
              <div>{USDollar.format(finalWinnings)}</div>
              <br />
            </div>
            <div className="mb-2">
            { fullWinningsStats.length > 0 &&
              (fullWinningsStats.map((p) => {
                return (
                  <div key={p.playerIndex}>
                    <span className="bold">{p.nickname}</span>
                    <span className="ml-1">{(USDollar.format(p.winnings)) }</span>
                  </div>
                );
              }))
            }
            </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="dashboard-app">
        <div className="header">
          <h2 className="mt-n1">Game: {room || "Game"}</h2>
          <h3>Round: {roundNumber}</h3>
          <div className="weather">Weather: {roundWeather}</div>
        </div>
        <div className="messages">
          <h3 className="pl-1">Player: {nickname.length > 0 ? nickname : currentUser.displayName} <small title={currentUser.uid}>({currentUser.uid.slice(0,4) + "..." + currentUser.uid.slice(-5,-1)})</small></h3>
          { roundNumber <= 0 && (<form onSubmit={handleNicknameChange} className="new-nickname">
            <input
              type="text"
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
              className="new-nickname-input"
              placeholder="Edit nickname"
            />
            <button type="submit" className="nickname-button">⤴</button>
          </form> ) }
          <div className="attack-and-defense">
            <div>{Math.round(empowerScore / 100)} ⚔️</div>
            <div>{Math.round(fortifyScore / 100)} 🛡️</div>
          </div>
          <div className="playArea">
            <div className="container">
              <div className="lifeInCenter btn-4 anyElement">
                <span>🌱</span>
                <div><strong>{Math.round(lifeScore / 100)}</strong></div>
              </div>
              <div className="middleColumn" title={elementOrder}>
                <Draggable onPosChangeTwo={reorderElements}>
                  <div id="airOrderDiv" data-elch={"a"} className="anyElement"><span>💨</span></div>
                  <div id="earthOrderDiv" data-elch={"e"} className="anyElement"><span>⛰️</span></div>
                  <div id="fireOrderDiv" data-elch={"f"} className="anyElement"><span>🔥</span></div>
                  <div id="fireOrderDiv" data-elch={"w"}  className="anyElement"><span>💧</span></div>
                </Draggable>
              </div>
              <div className="empower element-buttons">
                { airScore > 0 && earthScore > 0 && fireScore > 0 &&
                  <div>
                    <div className={canCastSpell ? "text-black mb-1" : "text-gray mb-1"}>Empower</div>
                    <button disabled={!canCastSpell} onClick={(e) => castSpell("empower", e)}>⚔️</button>
                  </div>
                }
              </div>
              <div className="fortify element-buttons">
                { waterScore > 0 && earthScore > 0 && fireScore > 0 &&
                  <div>
                    <button disabled={!canCastSpell} onClick={(e) => castSpell("fortify", e)}>🛡️</button>
                    <div className={canCastSpell ? "text-black mt-1" : "text-gray mt-1"}>Fortify</div>
                  </div>
                }
              </div>
              <div className="scry element-buttons">
                { airScore > 0 && fireScore > 0 && waterScore > 0 &&
                  <div>
                    <button disabled={!canCastSpell} onClick={(e) => castSpell("scry", e)}>🔮</button>
                    <div className={canCastSpell ? "text-black mt-1" : "text-gray mt-1"}>Scry</div>
                  </div>
                }
              </div>
              <div className="seed element-buttons">
                { airScore > 0 && earthScore > 0 && waterScore > 0 &&
                  <div>
                    <div className={canCastSpell ? "text-black mb-1" : "text-gray mb-1"}>Seed</div>
                    <button disabled={!canCastSpell} onClick={(e) => castSpell("seed", e)}>🌿</button>
                  </div>
                }
              </div>
              <div className="fire fireItem anyElement clickableButton" onClick={(e) => convertLifeTo("fire", e)}>
                <div>
                  <strong>{Math.round(fireScore / 100)}</strong></div>
                  <span>🔥</span>
                  <small>{Math.round(firePrice * 100) / 100}</small>
              </div>
              <div className="water waterItem anyElement clickableButton" onClick={(e) => convertLifeTo("water", e)}>
                <div>
                  <strong>{Math.round(waterScore / 100)}</strong></div>
                  <span>💧</span>
                  <small>{Math.round(waterPrice * 100) / 100}</small>
              </div>
              <div className="earth earthItem anyElement clickableButton" onClick={(e) => convertLifeTo("earth", e)}>
                <div>
                  <strong>{Math.round(earthScore / 100)}</strong></div>
                  <span>⛰️</span>
                  <small>{Math.round(earthPrice * 100) / 100}</small>
              </div>
              <div className="air airItem anyElement clickableButton" onClick={(e) => convertLifeTo("air", e)}>
                <div>
                  <strong>{Math.round(airScore / 100)}</strong></div>
                  <span>💨</span>
                  <small>{Math.round(airPrice * 100) / 100}</small>
              </div>
            </div>
            <div className="neighborhood-buttons">
              { neighborhood.length > 0 &&
              (
                <span>Attack:</span>
              )}
              { neighborhood.length > 0 &&
                (neighborhood.map((neighbor) => {
                  return (
                    <div key={neighbor.playerIndex} onClick={(e) => queueAttack(e, neighbor.playerIndex)} className={attacking === neighbor.playerIndex ? "flex-item queued" : "flex-item attackable"} style={{backgroundColor: neighbor.color}}>
                      {neighbor.nickname}
                      { 'netWorth' in neighbor && (<small>&nbsp;({Math.round(neighbor.netWorth / 100)})</small>) }
                    </div>
                  );
                }))
              }
            </div>
          </div>
          <div id="trollbox">
          {messages.map((message) => (
            <div key={message.id} className="message">
              <span className="user" style={{color: message.color}}>{message.user}:</span> {message.text}
            </div>
          ))}
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
