import React, { useState, useEffect, useRef } from "react";
import AnimatedBattleStats from "./AnimatedBattleStats";
import { Draggable } from "../lib";
import { serverTimestamp } from "firebase/firestore";
import { SyncCountdownTimer } from "./SyncCountdownTimer";
import { auth } from "../firebase-config.js";
import { signOut } from "firebase/auth";
import Cookies from "universal-cookie";

import "../styles/Dashboard.css";
const cookies = new Cookies();

export const Dashboard = ({ room, socket, currentUser, setIsAuth, setIsInChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [nickname, setNickname] = useState("Nickname");
  const [roundDuration, setRoundDuration] = useState(20);
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
  const [lifeScore, setLifeScore] = useState(1000);
  const [airScore, setAirScore] = useState(0);
  const [earthScore, setEarthScore] = useState(0);
  const [fireScore, setFireScore] = useState(0);
  const [waterScore, setWaterScore] = useState(0);
  const [empowerScore, setEmpowerScore] = useState(0);
  const [fortifyScore, setFortifyScore] = useState(0);
  const [lastSpellCastInRound, setLastSpellCastInRound] = useState(-1);
  const [canCastSpell, setCanCastSpell] = useState(true);
  const [alreadyDepictedBattles, setAlreadyDepictedBattles] = useState([]);
  const airScoreRef = useRef(airScore);
  const earthScoreRef = useRef(earthScore);
  const fireScoreRef = useRef(fireScore);
  const waterScoreRef = useRef(waterScore);
  const alreadyDepBat = useRef(alreadyDepictedBattles);
  const [processedEvents, setProcessedEvents] = useState(new Set());
  const [isAutoProceed, setIsAutoProceed] = useState(false);
  const [serverTime, setServerTime] = useState(null);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);

  useEffect(() => {
    alreadyDepBat.current = alreadyDepictedBattles; // Update ref when state changes
  }, [alreadyDepictedBattles]);

  useEffect(() => {
    // Setup socket connection
    socket.on('syncTimer', (data) => {
      setServerTime(data.remainingTime);
      setIsAutoProceed(true);
    });

    socket.on('paused', (data) => {
      console.log("PAUSED");
      setIsAutoProceed(false);
    })

    socket.on('roundDurationUpdate', (data) => {
      setRoundDuration(data.roundDuration);
    });

    // Cleanup
    return () => {
      socket.off(['syncTimer', 'roundDurationUpdate', 'paused']);
    };
  }, [socket]);

  useEffect(() => {
    airScoreRef.current = airScore; // Update ref when state changes
    earthScoreRef.current = earthScore; // Update ref when state changes
    fireScoreRef.current = fireScore; // Update ref when state changes
    waterScoreRef.current = waterScore; // Update ref when state changes
}, [airScore, earthScore, fireScore, waterScore]);

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

  const handleRoundIncrement = async (event) => {
    event.preventDefault();

    socket.emit("nextRound", {
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        roomId: room,
        room
      })
  };

  const signUserOut = async () => {
    await signOut(auth);
    cookies.remove("auth-token");
    setIsAuth(false);
    setIsInChat(false);
  };

  const beginAutoProceeding = async (event) => {
    event.preventDefault();
    setIsAutoProceed(true);

    socket.emit("startRoundTimer", {room: room})
  };

  const stopAutoProceeding = async (event) => {
    event.preventDefault();
    setIsAutoProceed(false);

    socket.emit("stopRoundTimer", {room: room})
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopyTooltip(true);
      setTimeout(() => {
        setShowCopyTooltip(false);
      }, 2000); // Hide after 2 seconds
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

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

  function calculateVisualCircles(totalCount) {
    // Base case for small numbers
    if (totalCount <= 2) {
      return {
        radius: 20,
        count: totalCount
      };
    }

    // Using logarithmic scaling for both radius and count
    // Log base 4 gives us a nice gradual increase
    const baseRadius = 20;
    const maxRadius = 40;
    const minCount = 3;
    const maxCount = 15;

    // Calculate radius
    // As count increases, radius gradually increases up to maxRadius
    const radiusScale = Math.min(1 + Math.log(totalCount) / 10, 2);
    const radius = Math.min(baseRadius * radiusScale, maxRadius);

    // Calculate visual count
    // Use log base 4 to reduce the number of circles more aggressively
    const logBase = 4;
    const suggestedCount = Math.max(
      minCount,
      Math.min(
        Math.round(Math.log(totalCount) / Math.log(logBase) * 2),
        maxCount
      )
    );

    return {
      radius: Math.round(radius),
      count: suggestedCount
    };
  }  

  useEffect(() => {
    socket.on("connection", (room) => {
      console.log("JOINING ROOM:", room);
      socket.join(room);
    });

    function onNewMessage(value) {
      if (value.room === room) {
        setMessages(messages => [...messages, value]);
      }
    }


  function depictBattle(battleId, winnerLeftOrRight, attackTroopColor, defendTroopColor, whatsLeft, lifeLooted) {

    const attackingCircleCount = ((whatsLeft + colorToElementScore(defendTroopColor)) / 100);

    console.log("ATTACKING:", attackingCircleCount);
    console.log("TO LOOT:", lifeLooted);
    if (winnerLeftOrRight === "left") {
      // Attacker wins and loots
      // We are the defender
      animateCircles(attackingCircleCount, attackTroopColor, false); // incoming!
      setTimeout(() => {
        spawnAndMoveCircles((lifeLooted / 100), attackTroopColor, true); // looting!
      }, (attackingCircleCount * 220));
    } else {
      spawnAndMoveCircles(attackingCircleCount, 'red', false); // outgoing/attacking
      setTimeout(() => {
        animateCircles((lifeLooted / 100), attackTroopColor, true); // looting!
      }, (attackingCircleCount * 220));
    }
  }

  function depictAttack(battleId, winnerLeftOrRight, attackTroopColor, defendTroopColor, whatsLeft, lifeLooted) {
    const attackingCircleCount = (colorToElementScore(attackTroopColor));
    spawnAndMoveCircles(attackingCircleCount, attackTroopColor, false); // outgoing/attacking

    const circlesToAnimate = calculateVisualCircles(attackingCircleCount);

    console.log("ATTACKINGS:", attackingCircleCount, attackTroopColor);
    if (winnerLeftOrRight === "left") {
      console.log("LOOTING:", lifeLooted);
      // Attacker wins and loots
      // We are the attacker
      setTimeout(() => {
        animateCircles((lifeLooted / 100), attackTroopColor, true); // looting!
      }, (circlesToAnimate.count) + 2200);
    }
  }

  function animateCircles(circleCount, circleColor, isLooting) {
    const circlesToAnimate = calculateVisualCircles(circleCount);
    for (let i = 0; i < circlesToAnimate.count; i++) {
      // Stagger the creation of each circle
      setTimeout(() => {
        const { arena, arenaWidth } = getArena();

        const circle = document.createElement('div');
        circle.className = isLooting ? 'alootcircle' : 'circle';
        circle.style.backgroundColor = circleColor;
        circle.style.width = `${circlesToAnimate.radius}px`;
        circle.style.height = `${circlesToAnimate.radius}px`;

        // Positioning circles along the top edge
        circle.style.top = '0px';
        circle.style.left = `${(Math.random() * arenaWidth / 4) + (arenaWidth * 3 / 8)}px`; // Random position along the width in the middle half

        arena.appendChild(circle);
        moveCircle(circle);
      }, (i * 100) + ((Math.random() * 52) * circlesToAnimate.count - i)); // Stagger each circle by 100 milliseconds
    }
  }

    function moveCircle(circle) {
      const { arenaX, arenaY, centerX, centerY } = getArena();
        circle.dataset.moved = 0;
        const interval = setInterval(function () {
            const rect = circle.getBoundingClientRect();
            const distX = Math.abs((rect.left + (rect.width / 2)) - centerX - arenaX);
            const distY = Math.abs((rect.top + (rect.height / 2)) - centerY - arenaY);
            circle.dataset.moved = Number(circle.dataset.moved) + 1;
            if (distX < 50 && distY < 50) {
                explodeCircle(circle);
                clearInterval(interval);
            }

            // Backup for the weird case when the circles don't explode
            // even when they've reached the center
            if (circle.dataset.moved > 100) {
              explodeCircle(circle);
              clearInterval(interval);
            }
        }, 10);
    }

    function explodeCircle(circle) {
        circle.style.transition = 'transform 0.5s, opacity 0.5s';
        circle.style.transform = 'scale(2)';
        circle.style.opacity = '0';
        setTimeout(() => circle.remove(), 250); // Removes the circle after the effect
    }

    function spawnAndMoveCircles(circleCount, circleColor, isLooting) {
      const { arena, centerX, centerY } = getArena();
      const smallCircleCount = circleCount / 100;

      let circlesToAnimate = calculateVisualCircles(smallCircleCount);

      for (let i = 0; i < circlesToAnimate.count; i++) {
        setTimeout(() => {
          const circle = document.createElement('div');
          circle.className = isLooting ? 'lootcircle' : 'attackingcircle';
          circle.style.backgroundColor = circleColor;
          circle.style.opacity = '0';  // Start fully transparent
          circle.style.transform = 'scale(0.25)'; // Start smaller

          circle.style.width = `${circlesToAnimate.radius}px`;
          circle.style.height = `${circlesToAnimate.radius}px`;

          const randomizer = Math.random() * 10 - 10; // Random deviation from center, range -50 to +50 pixels
          const randomizer2 = Math.random() * 15 - 10; // Random deviation from center, range -50 to +50 pixels

          // Positioning circles at the center
          circle.style.top = `${centerY - 35 + (randomizer)}px`; // Adjusted for the circle's size
          circle.style.left = `${centerX - 15 + (randomizer2)}px`;

          arena.appendChild(circle);
          fadeAndMoveCircle(circle);
        }, (i * 100) + ((Math.random() * 15) * circlesToAnimate.count - i)); // Stagger each circle by 100 milliseconds
      }

      function fadeAndMoveCircle(circle) {
        circle.style.transition = 'top 2s, left 2s, opacity 2s ease-in, transform 2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        circle.style.opacity = '1';  // Fade in
        circle.style.transform = 'scale(1)'; // Grow to full size

        setTimeout(() => {
            const deviation = Math.random() * 100 - 50; // Random deviation from center, range -50 to +50 pixels
            circle.style.top = '-45px'; // Move above the top edge
            circle.style.left = `${centerX - 10 + deviation}px`; // Move to a random position along the x-axis
        }, 500);  // Start moving after fully appearing

        setTimeout(() => {
            circle.remove();  // Remove circle from DOM after it moves out
        }, 2500);  // Enough time to finish moving
      }
    }

    function onBattleResults(value) {
      const eventId = value.id;

      // Check if the event has already been processed
      if (!processedEvents.has(eventId)) {
        if (value.room === room && !alreadyDepBat.current.includes(value.id)) {
          setAlreadyDepictedBattles(prevIds => [...prevIds, value.id]);

          console.log("BATTLE RESULTS:", value);
          console.log("alreadyDepictedBattles:", alreadyDepBat.current);
          let winnerLeftOrRight = "left";
          let whatsLeft = value.attackRemaining > 0 ? value.attackRemaining : value.defendRemaining;
          if (value.attackRemaining === 0 && value.defendRemaining > 0) {
            winnerLeftOrRight = "right";
          }

          if (value.attackingPlayerId !== currentUser.uid) {
            // We are the defender
            depictBattle(value.id, winnerLeftOrRight,value.attackTroopColor,value.defendTroopColor,whatsLeft,value.lifeLooted);
          } else {
            depictAttack(value.id, winnerLeftOrRight,value.attackTroopColor,value.defendTroopColor,whatsLeft,value.lifeLooted);
          }
        }
      }
      setProcessedEvents((prevSet) => new Set(prevSet).add(eventId));
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
      socket.off('battleResults', onBattleResults);
      socket.off('playerState', onPlayerState);
      socket.off('newRound', onNewRound);
      socket.off('gameResults', onGameResults);

    };
  }, [socket, currentUser.uid, room, processedEvents ]);

  function getArena() {
    const arena = document.getElementById('arena');
    const arenaRect = arena.getBoundingClientRect();
    const arenaX = arenaRect.x;
    const arenaY = arenaRect.y;
    const arenaWidth = arena.offsetWidth;
    const arenaHeight = arena.offsetHeight;
    const centerX = arenaWidth / 2;
    const centerY = arenaHeight / 2;

    return {arena, arenaRect, arenaX, arenaY, arenaWidth, arenaHeight, centerX, centerY};
  }

  const convertLifeTo = async (elementToGet, event) => {
    event.preventDefault();

    let convertAmount = 1;

    // if (shiftHeld) {
    //   convertAmount = 10;
    // }

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

  function colorToElementScore(color) {
    if (color === "gray") {
      return airScoreRef.current;
    } else if (color === "brown") {
      return earthScoreRef.current;
    } else if (color === "red") {
      return fireScoreRef.current;
    } else if (color === "blue") {
      return waterScoreRef.current;
    } else {
      return 0
    }
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
            <i className="fa fa-sign-out signout-button" title="Log out" onClick={signUserOut}></i>
            
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
          <div
            className="weather">
            <p className="cursor-copy"
              title={room}
              onClick={() =>
                copyToClipboard(room)
              }
            >
              <b>Room:</b> {room}
            </p>
            {(showCopyTooltip && <div className="tooltip">Copied!</div>)}
            <p><b>Round:</b> {roundNumber}</p>
            <p><b>Weather:</b> {roundWeather}</p>
          </div>
        </div>
        <div className="mainbuttons">
          <div id="arena" className="arena">
          <div className="container">
            <AnimatedBattleStats
              lifeScore={lifeScore}
              airScore={airScore}
              earthScore={earthScore}
              fireScore={fireScore}
              waterScore={waterScore}
              airPrice={airPrice}
              earthPrice={earthPrice}
              firePrice={firePrice}
              waterPrice={waterPrice}
              elementOrder={elementOrder}
              onConvertLifeTo={convertLifeTo}
            />
            {/* <div className="lifeInCenter btn-4 anyElement">
                <span>🌱</span>
                <div><strong>{Math.round(lifeScore / 100)}</strong></div>
              </div> */}
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
              {
              /* <div className="fire fireItem anyElement clickableButton" onClick={(e) => convertLifeTo("fire", e)}>
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
              </div> */
              }
            </div>
            <div className="glowz"></div>
            <canvas id="canvas1"></canvas>
          </div>
          <div className="neighborhood-buttons centered w-full">
              { neighborhood.length > 0 &&
              (
                <span>Attack:</span>
              )}
              <div className="player-buttons">
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
          {/* disable trollbox for now */
            false &&
            <div id="trollbox">
              {messages.map((message) => (
                <div key={message.id} className="message">
                  <span className="user" style={{color: message.color}}>{message.user}:</span> {message.text}
                </div>
              ))}
            </div>
          }
        </div>
        {/* disable trollbox for now */
          false && 
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
        }
        { isAutoProceed ?
          (<div className="w-full timer-button flex justify-center">
            <div className="w-16">
              <SyncCountdownTimer
                duration={roundDuration || 20}
                serverTimeRemaining={serverTime}
                size={60}
                onComplete={() => {
                  return { shouldRepeat: true, delay: 0 }
                }}
              />
            </div>
            
            <div className="w-full"><button className="circleButton bigText stoppem" onClick={stopAutoProceeding}>⏱️</button></div>
          </div>) :
          (
            <div className="timer-button">
              <div className="w-full"><button className="circleButton bigText" onClick={beginAutoProceeding}>⏱️</button></div>
              { false && <div className="centered"><button onClick={handleRoundIncrement}>Next Round</button></div> }
            </div>
          )
        }
      </div>
    </>
  );
};
