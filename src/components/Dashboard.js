import React, { useState, useEffect, useRef } from "react";
import { useSprings, animated } from '@react-spring/web';
import { useDrag } from 'react-use-gesture';
import clamp from 'lodash.clamp';
import swap from 'lodash-move';

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

  const arenaRef = useRef(null); // Initialize the ref with null

  //const [arena, setArena] = useState()
  const [arenaX, setArenaX] = useState(0);
  const [arenaY, setArenaY] = useState(0);
  const [arenaWidth, setArenaWidth] = useState(0);
  const [arenaHeight, setArenaHeight] = useState(0);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);

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

  function depictBattle(winnerLeftOrRight, leftTroopColor, rightTroopColor, whatsLeft) {
    
  }

  const [shiftHeld, setShiftHeld] = useState(false);


  function animateCircles(circleCount, circleColor) {
    for (let i = 0; i < circleCount; i++) {
      // Stagger the creation of each circle
      setTimeout(() => {

        const circle = document.createElement('div');
        circle.className = 'circle';
        circle.style.backgroundColor = circleColor;

        // Positioning circles along the top edge
        circle.style.top = '0px';
        circle.style.left = `${Math.random() * arenaWidth}px`; // Random position along the width

        arenaRef.current.appendChild(circle);
        moveCircle(circle);
      }, i * 100); // Stagger each circle by 100 milliseconds
    }

    function moveCircle(circle) {
        const interval = setInterval(function () {
            const rect = circle.getBoundingClientRect();
            const distX = Math.abs((rect.left + (rect.width / 2)) - centerX - arenaX);
            const distY = Math.abs((rect.top + (rect.height / 2)) - centerY - arenaY);

            if (distX < 40 && distY < 40) {
                explodeCircle(circle);
                clearInterval(interval);
            }
        }, 10);
    }

    function explodeCircle(circle) {
        circle.style.transition = 'transform 0.25s, opacity 0.25s';
        circle.style.transform = 'scale(2)';
        circle.style.opacity = '0';
        setTimeout(() => circle.remove(), 250); // Removes the circle after the effect
    }
}
function spawnAndMoveCircles(circleCount, circleColor, isLooting) {
  for (let i = 0; i < circleCount; i++) {
      setTimeout(() => {
          const circle = document.createElement('div');
          circle.className = isLooting ? 'lootcircle' : 'attackingcircle';
          circle.style.backgroundColor = circleColor;
          circle.style.opacity = '0';  // Start fully transparent
          circle.style.transform = 'scale(0.5)'; // Start smaller

          const randomizer = Math.random() * 10 - 10; // Random deviation from center, range -50 to +50 pixels
          const randomizer2 = Math.random() * 15 - 10; // Random deviation from center, range -50 to +50 pixels

          // Positioning circles at the center
          circle.style.top = `${centerY - 30 + (randomizer)}px`; // Adjusted for the circle's size
          circle.style.left = `${centerX - 10 + (randomizer2)}px`;

          arenaRef.current.appendChild(circle);
          fadeAndMoveCircle(circle);
      }, i * 100); // Stagger each circle by 100 milliseconds
  }

  function fadeAndMoveCircle(circle) {
    circle.style.transition = 'top 2s, left 2s, opacity 4s, transform 4s';
    circle.style.opacity = '1';  // Fade in
    circle.style.transform = 'scale(1)'; // Grow to full size

    setTimeout(() => {
        const deviation = Math.random() * 100 - 50; // Random deviation from center, range -50 to +50 pixels
        circle.style.top = '-20px'; // Move above the top edge
        circle.style.left = `${centerX - 10 + deviation}px`; // Move to a random position along the x-axis
    }, 500);  // Start moving after fully appearing

    setTimeout(() => {
        circle.remove();  // Remove circle from DOM after it moves out
    }, 2500);  // Enough time to finish moving
}
}

  function downHandler({key}) {
    if (key === 'Shift') {
      setShiftHeld(true);
    }
  }

  function upHandler({key}) {
    if (key === 'Shift') {
      setShiftHeld(false);
    } else if (key === 'e') {
      animateCircles(10, '#ff0000');
    } else if (key === 'r') {
      spawnAndMoveCircles(4, 'red', true);
    } else if (key === 't') {
      spawnAndMoveCircles(4, 'red', false);
    } else {
      console.log("pressed:", key);
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    if (arenaRef.current) {
      // You can interact with the 'arena' div here
      console.log('The arena div has loaded, and we can access it:', arenaRef.current);
      const arenaRect = arenaRef.current.getBoundingClientRect();

      console.log("arenaRect:", arenaRect);
      console.log("SETTING ARENAX:", arenaRect.x);
      setArenaX(arenaRect.x);
      setArenaY(arenaRect.y);
      setArenaWidth(arenaRef.current.offsetWidth);
      setArenaHeight(arenaRef.current.offsetHeight);
      setCenterX(arenaRef.current.offsetWidth / 2);
      setCenterY(arenaRef.current.offsetHeight / 2);
      console.log("SET:", arenaRef.current);
      console.log("CENTERX:", centerX);
      console.log("CENTERY:", centerY);
      console.log("ArenaX:", arenaX);
      console.log("ArenaY:", arenaY);
      
    }

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

    function onBattleResults(value) {
      if (value.room === room) {
        console.log("BATTLE RESULTS:", value);
        let winnerLeftOrRight = "left";
        let whatsLeft = value.attackRemaining > 0 ? value.attackRemaining : value.defendRemaining;
        if (value.attackRemaining == 0 && value.defendRemaining > 0) {
          winnerLeftOrRight = "right";
        }

        depictBattle(winnerLeftOrRight,value.leftTroopColor,value.rightTroopColor,whatsLeft);
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
    socket.on('battleResults', onBattleResults);
    socket.on('playerState', onPlayerState);
    socket.on('newRound', onNewRound);
    socket.on('gameResults', onGameResults);

    return () => {
      socket.off('newMessage', onNewMessage);
    };
  }, [socket, currentUser.uid, room]);

  useEffect(() => {
    console.log("AHFDSKFDHSFKHGSKJFDHGKFJHGFKJD");
    console.log("AHFDSKFDHSFKHGSKJFDHGKFJHGFKJD");
    console.log(arenaX);
    console.log("AHFDSKFDHSFKHGSKJFDHGKFJHGFKJD");
    console.log("AHFDSKFDHSFKHGSKJFDHGKFJHGFKJD");
    const arenaRect = arenaRef.current.getBoundingClientRect();

    console.log("arenaRect:", arenaRect);
    console.log("SETTING ARENAX:", arenaRect.x);
    setArenaX(arenaRect.x);
    setArenaY(arenaRect.y);
    setArenaWidth(arenaRef.current.offsetWidth);
    setArenaHeight(arenaRef.current.offsetHeight);
    setCenterX(arenaRef.current.offsetWidth / 2);
    setCenterY(arenaRef.current.offsetHeight / 2);
    return () => {    };
  }, [arenaX, arenaY]);

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

  const fn = (order, active = false, originalIndex = 0, curIndex = 0, y = 0) => (index) => {

  let middlePadding = index > 1 ? 150 : 0;
  return active && index === originalIndex
    ? {
        y: curIndex * 110 + y + middlePadding,
        scale: 1.1,
        zIndex: 1,
        shadow: 15,
        immediate: (key) => key === 'y' || key === 'zIndex',
      }
    : {
        y: order.indexOf(index) * 110 + middlePadding,
        scale: 1,
        zIndex: 0,
        shadow: 1,
        immediate: false,
      }
  }

  function PrettyDraggableList({ items }) {
    const order = useRef(items.map((_, index) => index)) // Store indicies as a local ref, this represents the item order
    const [springs, api] = useSprings(items.length, fn(order.current)) // Create springs, each corresponds to an item, controlling its transform, scale, etc.
    const bind = useDrag(({ args: [originalIndex], active, movement: [, y] }) => {
      const curIndex = order.current.indexOf(originalIndex)
      const curRow = clamp(Math.round((curIndex * 100 + y) / 100), 0, items.length - 1)
      const newOrder = swap(order.current, curIndex, curRow)
      api.start(fn(newOrder, active, originalIndex, curIndex, y)) // Feed springs new style data, they'll animate the view without causing a single render
      if (!active) order.current = newOrder
    })
    return (
      <div className={"content"} style={{ height: items.length * 50 }}>
        {springs.map(({ zIndex, shadow, y, scale }, i) => (
          <animated.div
            {...bind(i)}
            key={i}
            style={{
              zIndex,
              boxShadow: shadow.to(s => `rgba(0, 0, 0, 0.15) 0px ${s}px ${2 * s}px 0px`),
              y,
              scale,
            }}
            children={items[i]}
          />
        ))}
      </div>
    )
  }

  if (gameIsOver) {
    return (
      <div className="dashboard-app">
        <div className="header">
          <h2 className="mb-1">Game: {room || "Game"}</h2>
          <h3>Round: {roundNumber} (COMPLETE)</h3>
        </div>
        <div className="messages">
          <h3 className="pl-1">Player: {nickname.length > 0 ? nickname : currentUser.displayName} <small title={currentUser.uid}>({currentUser.uid.slice(0,4) + "..." + currentUser.uid.slice(-5,-1)})</small><small> {isJoined ? "🟢" : "🔴"}</small></h3>
            <div className="life-score">
              <h4>Final Life & Elements Score:</h4>
              <div className="life-emoji">🌱</div>
              <div>{Math.round((lifeScore + ((earthScore + airScore + fireScore)/ 4)) / 100)}</div>
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
        <div className="header pb-2 mb-2">
          <div className="messages">
            <div className="pl-1 top-1">Player: {nickname.length > 0 ? nickname : currentUser.displayName} <small title={currentUser.uid}>({currentUser.uid.slice(0,4) + "..." + currentUser.uid.slice(-5,-1)})</small>
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
            </div>

            <div className="attack-and-defense js-explosion">
              <div>{Math.round(empowerScore / 100)} ⚔️</div>
              <div>{Math.round(fortifyScore / 100)} 🛡️</div>
            </div>
          </div>
          <div className="weather">
            <p><b>Room:</b> {room}</p>
            <p><b>Round:</b> {roundNumber}</p>
            <p><b>Weather:</b> {roundWeather}</p>
          </div>
        </div>
        <div className="messages">
          <div id="arena" className="arena" ref={arenaRef}>
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
                {/* <PrettyDraggableList items={'🔥 ⛰️ 💧 💨'.split(' ')} /> */}
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
            <div className="glowz"></div>
            <canvas id="canvas1"></canvas>
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
          <div id="battle"></div>
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
