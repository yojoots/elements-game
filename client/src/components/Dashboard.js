import React, { useState, useEffect, useRef } from "react";
import AnimatedBattleStats from "./AnimatedBattleStats";
import GameSettings from "./GameSettings";
import FloatingMenu from "./FloatingMenu";
import JoinedPlayersList from "./JoinedPlayersList";
import InlineNicknameEditor from './InlineNicknameEditor';
import StartButton from './StartButton';
import { TooltipProvider, InfoBubble, ForceVisibleWhen } from './TooltipSystem';
import Hexagon from "./Hexagon";
import { Draggable } from "../lib";
import { serverTimestamp } from "firebase/firestore";
import { SyncCountdownTimer } from "./SyncCountdownTimer";
import { auth } from "../firebase-config.js";
import { signOut } from "firebase/auth";
import { Play } from 'lucide-react';
import Cookies from "universal-cookie";
import { colorFromElement } from "../lib/helpers";

import "../styles/Dashboard.css";
const cookies = new Cookies();

export const Dashboard = ({ room, socket, currentUser, setIsAuth, setIsInChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [nickname, setNickname] = useState("Nickname");
  const [roundDuration, setRoundDuration] = useState(20);
  const [roundNumber, setRoundNumber] = useState(0);
  const [roundCount, setRoundCount] = useState(10);
  const [playerColor, setPlayerColor] = useState("black");
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
  const airScoreRef = useRef(airScore);
  const earthScoreRef = useRef(earthScore);
  const fireScoreRef = useRef(fireScore);
  const waterScoreRef = useRef(waterScore);
  const [processedEvents, setProcessedEvents] = useState(new Set());
  const [isAutoProceed, setIsAutoProceed] = useState(false);
  const [serverTime, setServerTime] = useState(null);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [isFirstPlayer, setIsFirstPlayer] = useState(false);
  const [gameSettings, setGameSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [isSpectator, setIsSpectator] = useState(false);
  const [spectatorState, setSpectatorState] = useState(null);

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

    socket.on('gameSettings', (settings) => {
      setRoundDuration(settings.roundDuration);
      setRoundCount(settings.roundCount);
      setGameSettings(settings);
    });
  
    socket.on('firstPlayerStatus', (status) => {
      setIsFirstPlayer(status.isFirstPlayer);
    });

    socket.on('spectatorState', (state) => {
      setIsSpectator(true);
      setSpectatorState(state);
    });

    socket.on('skirmishResult', (event) => {
      if (event.room === room && !processedEvents.has(event.id)) {
        setProcessedEvents((prevSet) => new Set(prevSet).add(event.id));
    
        const isAttacker = event.attackerId === currentUser.uid;
        const isDefender = event.defenderId === currentUser.uid;
    
        // Only process events relevant to this player
        if (!isAttacker && !isDefender) return;
    
        switch(event.type) {
          case 'troops-out':
            if (isAttacker) {
              // Attacker sees their troops going out
              spawnAndMoveCircles(
                event.amount,
                colorFromElement(event.element),
                false
              );
            } else if (isDefender) {
              // Defender sees enemy troops coming in
              animateCircles(
                event.amount,
                colorFromElement(event.element),
                false
              );
            }
            break;
    
          case 'skirmish-result':
            if (event.lifeLooted > 0) {
              if (isDefender) {
                // Defender sees life leaving from center
                setTimeout(() => {
                  spawnAndMoveCircles(  // Note: keeping spawnAndMoveCircles instead of animateCircles
                    event.lifeLooted,
                    colorFromElement(event.attackElement),
                    true
                  );
                }, 800);
              }
            }
            break;
    
          case 'troops-return':
            if (isAttacker) {
              // Split returning troops into looting and non-looting
              const lootingTroops = Math.min(event.lifeLooted, event.amount);
              const nonLootingTroops = event.amount - lootingTroops;
    
              // Show looting troops first if any
              if (lootingTroops > 0) {
                animateCircles(
                  lootingTroops,
                  colorFromElement(event.element),
                  true
                );
              }
              
              // Then show non-looting troops if any
              if (nonLootingTroops > 0) {
                animateCircles(
                  nonLootingTroops,
                  colorFromElement(event.element),
                  false
                );
              }
            }
            break;
          default:
            console.log("Unrecognized skirmish event:", event.type);
        }
      }
    });

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

      const circlesToAnimate = calculateVisualCircles(circleCount);

      for (let i = 0; i < circlesToAnimate.count; i++) {
          setTimeout(() => {
              const circle = document.createElement('div');
              circle.className = isLooting ? 'lootcircle' : 'attackingcircle';
              circle.style.backgroundColor = circleColor;
              circle.style.opacity = '0';
              circle.style.transform = 'scale(0.25)';
              circle.style.width = `${circlesToAnimate.radius}px`;
              circle.style.height = `${circlesToAnimate.radius}px`;

              const randomizer = Math.random() * 10 - 10;
              const randomizer2 = Math.random() * 15 - 10;

              circle.style.top = `${centerY - 35 + (randomizer)}px`;
              circle.style.left = `${centerX - 15 + (randomizer2)}px`;

              arena.appendChild(circle);
              fadeAndMoveCircle(circle);
          }, (i * 100) + ((Math.random() * 15) * circlesToAnimate.count - i));
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

    // Cleanup
    return () => {
      socket.off('syncTimer');
      socket.off('roundDurationUpdate');
      socket.off('paused');
      socket.off('gameSettings');
      socket.off('firstPlayerStatus');
      socket.off('spectatorState');
      socket.off('skirmishResult');
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

    socket.emit("startRoundTimer", {
      room: room,
      roundDuration: roundDuration // Pass the current roundDuration
    });
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
    
    // Get the nickname value from the form's input element
    const newNickname = event.target[0].value;
    
    if (newNickname === "") return;

    socket.emit("updateNickname", {
        nickname: newNickname,
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        userName: currentUser.displayName,
        roomId: room,
        room,
    })
  };

  const queueAttack = async (targetPlayerIndex) => {
    if (targetPlayerIndex < 0) return;

    if (attacking === targetPlayerIndex) {
      socket.emit("unqueueAttack", {
        targetPlayerIndex: targetPlayerIndex,
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        roomId: room
      })

      setAttacking(0);
    } else {
      socket.emit("queueAttack", {
        targetPlayerIndex: targetPlayerIndex,
        createdAt: serverTimestamp(),
        userUid: currentUser.uid,
        roomId: room
      })

      setAttacking(targetPlayerIndex);
    }
  };

  function calculateVisualCircles(totalCount) {
    // totalCount is already properly scaled now
    const radius = 20;
    
    // Ensure we show at least 1 circle for very small amounts
    const minCircles = totalCount > 0 ? 1 : 0;
    // Cap at 50 circles for visual clarity
    const count = Math.min(Math.max(Math.round(totalCount), minCircles), 30);
  
    return {
      radius: radius,
      count: count
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
        setPlayerColor(value.playerState.color)
        setAllPlayers(value.allPlayers);
      }
    }

    const onGameResults = (value) => {
      if (value.roomId === room) {
        let player = value.players.find((p) => {return p.id === currentUser.uid});
        setFinalWinnings(player.winnings);
        let fullWinningsStatistics = value.players.sort((a, b) => b.winnings - a.winnings).map((p) => {return {playerIndex: p.playerIndex, nickname: p.nickname, winnings: p.winnings};});
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

  if (gameIsOver) {
    return (
      /* ! GAME IS OVER GAME IS OVER GAME IS OVER */
      /* ! GAME IS OVER GAME IS OVER GAME IS OVER */
      /* ! GAME IS OVER GAME IS OVER GAME IS OVER */
      <div className="dashboard-app">
        <div className="header game-over-header">
          <h2 className="mb-1">Game: {room || "Game"}</h2>
          <h3>Round: {roundNumber} (COMPLETE)</h3>
        </div>
        <div className="messages">
          <h3 className="pl-1 text-center" title={currentUser.uid}>Player: {nickname.length > 0 ? nickname : currentUser.displayName} {( false && <small title={currentUser.uid}>({currentUser.uid.slice(0,4) + "..." + currentUser.uid.slice(-5,-1)})</small>)}{<span className="active-player-color" style={{ backgroundColor: playerColor }}></span>}{false && <small> {isJoined ? "🟢" : "🔴"}</small>}</h3>
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
            <div className="mb-2 mt-14">
            <h3 className="leaderboard-header">Leaderboard</h3>
            { fullWinningsStats.length > 0 &&
              (fullWinningsStats.sort((a, b) => b.winnings - a.winnings).map((p) => {
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

  if (isSpectator && spectatorState) {
    if (spectatorState.isGameOver) {
        return (
            <div className="dashboard-app">
                <div className="header game-over-header">
                    <h2 className="mb-1">Game: {room || "Game"}</h2>
                    <h3>Round: {spectatorState.currentRound} (COMPLETE)</h3>
                </div>
                <div className="messages mt-20">
                    <h3 className="pl-1 text-center">Spectator View</h3>
                    <div className="mb-2 mt-14">
                        <h3 className="leaderboard-header">Leaderboard</h3>
                        {spectatorState.winningsStats.sort((a, b) => b.winnings - a.winnings).map((p) => (
                            <div key={p.playerIndex}>
                                <span className="bold">{p.nickname}</span>
                                <span className="ml-1">{USDollar.format(p.winnings)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    } else {
        return (
            <div className="dashboard-app">
                <div className="header">
                    <h2>Game: {room || "Game"} (Spectating)</h2>
                    <h3>Round: {spectatorState.currentRound} / {spectatorState.roundCount}</h3>
                </div>
                <div className="messages mt-20">
                    <h3 className="pl-1 text-center">Current Players</h3>
                    <div className="mb-2 mt-4">
                        {spectatorState.players.map((p) => (
                            <div key={p.playerIndex} className="flex items-center gap-2 p-2">
                                <span
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: p.color }}
                                />
                                <span>{p.nickname}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
  }

  return (
    <TooltipProvider round={roundNumber}>
        <div className="dashboard-app">
          <div className="header fixed">
            <div className="messages">
              <div className="pt-1 pl-6">
              <div className="top-a1 flex font-semibold	z-100">
                {false && <span className="active-player-color" style={{ backgroundColor: playerColor }}></span>}
                <span className="pl-0 pr-2" title={currentUser.uid}>Player:</span>
                <InlineNicknameEditor
                  currentNickname={nickname}
                  onSubmit={handleNicknameChange}
                  displayName={currentUser.displayName}
                  roundNumber={roundNumber}
                  color={ playerColor }
                />
                <i className="fa fa-sign-out signout-button my-auto" title="Log out" onClick={signUserOut}></i>
              </div>
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
              <p><b>Round:</b> {roundNumber} / {roundCount}</p>
              <p><b>Weather:</b> {roundWeather}</p>
            </div>
          </div>
          {showSettings && roundNumber === 0 && (
              <GameSettings
                socket={socket}
                room={room}
                userUid={currentUser.uid}
                isFirstPlayer={isFirstPlayer}
                currentSettings={gameSettings}
                setShowSettings={setShowSettings}
              />
          )}

          {!showSettings && roundNumber === 0 && (
            <StartButton onClick={() => setShowSettings(true)} />
          )}
          {false && !showSettings && roundNumber === 0 && (
            <button 
              title="Start"
              onClick={() => setShowSettings(true)}
              className="fixed bottom-4 right-4 p-2 text-blue-400 text-xs rounded shadow z-101"
            >
              ⚙️
              <Play fill="lightgreen" stroke="lightgreen" size={24} />
            </button>
          )}
          <div className="mainbuttons">
            <div id="arena" className="arena">
            <div className="container relative overflow-y-visible">
              <div className="relative">
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
                <InfoBubble className="absolute -right-0 top-1/2 transform" direction="downright" tooltipStyle={{top: "65px", right: "50px"}}>
                  <b className="small-caps">Elements Battle For Life</b>
                  <br />
                  Convert life force into elements. Each element has a dynamic price which will fluctuate each round.
                </InfoBubble>
              </div>
              {/* <div className="lifeInCenter btn-4 anyElement">
                  <span>🌱</span>
                  <div><strong>{Math.round(lifeScore / 100)}</strong></div>
                </div> */}
                <InfoBubble className="absolute top-0" direction="lowright" tooltipStyle={{top: '470px', left: '0px', width: '200px'}}>
                  <b className="small-caps">Element Order Matters</b>
                  <br />
                  Order determines battle advantages. Drag or long-press to reorder elements (top first). <br />💧 &gt; 🔥 &gt; 💨 &gt; ⛰️ &gt; 💧...
                </InfoBubble>
                <InfoBubble className="absolute top-0" direction="right" tooltipStyle={{top: '280px', left: '0px', width: '200px'}}>
                  <b className="small-caps">Most Life Wins</b>
                  <br />
                  Life automatically grows each round, and can be converted into elements. Successful attacks will loot other players' life.<br />
                </InfoBubble>
                <div className="middleColumn relative" title={elementOrder}>
                  <Draggable onPosChangeTwo={reorderElements}>
                    <div id="airOrderDiv" data-elch={"a"} className="anyElement"><span>💨</span></div>
                    <div id="earthOrderDiv" data-elch={"e"} className="anyElement"><span>⛰️</span></div>
                    <div id="fireOrderDiv" data-elch={"f"} className="anyElement"><span>🔥</span></div>
                    <div id="waterOrderDiv" data-elch={"w"}  className="anyElement"><span>💧</span></div>
                  </Draggable>
                  {/* <PrettyDraggableList items={'🔥 ⛰️ 💧 💨'.split(' ')} /> */}
                </div>
                <div className="empower element-buttons">
                  { airScore > 0 && earthScore > 0 && fireScore > 0 &&
                    <div>
                      <div className={canCastSpell ? "text-blue-400 mb-1 spell-label" : "text-gray mb-1 spell-label"}>Empower</div>
                      <button disabled={!canCastSpell} onClick={(e) => castSpell("empower", e)}>⚔️</button>
                    </div>
                  }
                </div>
                <div className="fortify element-buttons">
                  { waterScore > 0 && earthScore > 0 && fireScore > 0 &&
                    <div>
                      <button disabled={!canCastSpell} onClick={(e) => castSpell("fortify", e)}>🛡️</button>
                      <div className={canCastSpell ? "text-blue-400 mt-1 spell-label" : "text-gray mt-1 spell-label"}>Fortify</div>
                    </div>
                  }
                </div>
                <div className="scry element-buttons">
                <ForceVisibleWhen when={airScore > 0 && fireScore > 0 && waterScore > 0}>
                  <div>
                    <button disabled={!canCastSpell} onClick={(e) => castSpell("scry", e)}>🔮</button>
                    <InfoBubble className="absolute top-0" direction="downleft" tooltipStyle={{top: "-102px", left: "-2px", width: '170px'}}>
                      <b className="small-caps">Spells Cost Elements</b>
                      <br />
                      Combine 3 elements to cast a spell 1x per round.<br />
                    </InfoBubble>
                    <div className={canCastSpell ? "text-blue-400 mt-1 spell-label" : "text-gray mt-1 spell-label"}>
                      Scry
                    </div>
                  </div>
                </ForceVisibleWhen>
                </div>
                <div className="seed element-buttons">
                  { airScore > 0 && earthScore > 0 && waterScore > 0 &&
                    <div>
                      <div className={canCastSpell ? "text-blue-400 mb-1 spell-label" : "text-gray mb-1 spell-label"}>Seed</div>
                      <button disabled={!canCastSpell} onClick={(e) => castSpell("seed", e)}>🌿</button>
                    </div>
                  }
                </div>
              </div>
              <div className="glowz"></div>
              <canvas id="canvas1"></canvas>
            </div>
            {roundNumber === 0 && (
              <JoinedPlayersList 
                players={allPlayers} 
                currentUserId={currentUser.uid}
              />
            )}

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
              {false && 
              <div className="neighborhood-buttons centered">
                { neighborhood.length > 0 &&
                (
                  <span className="attack-span">Attack</span>
                )}
                <div className="player-buttons">
                { neighborhood.length > 0 &&
                  (neighborhood.map((neighbor) => {
                    return (
                      <Hexagon key={neighbor.playerIndex} color={neighbor.color} onClick={(e) => queueAttack(e, neighbor.playerIndex)} className={attacking === neighbor.playerIndex ? "flex-item attackable queued" : "flex-item attackable"} >
                        {neighbor.nickname}
                        { 'netWorth' in neighbor && (<small>&nbsp;({Math.round(neighbor.netWorth / 100)})</small>) }
                      </Hexagon>
                    );
                  }))
                }
                </div>
              </div>
              }
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
            (<div className="timer-button">
              <div className="w-16">
                <SyncCountdownTimer
                  duration={roundDuration}
                  serverTimeRemaining={serverTime}
                  size={60}
                  onComplete={() => {
                    return { shouldRepeat: true, delay: 0 }
                  }}
                />
              </div>
              
              {false && <div className="w-full z-100"><button className="timer-button-holder bigText" onClick={stopAutoProceeding}>⏱️</button></div>}
            </div>) :
            ( false &&
              <div className="timer-button">
                <div className="w-full z-100"><button className="timer-button-holder bigText" onClick={beginAutoProceeding}>⏱️</button></div>
                { false && <div className="centered"><button onClick={handleRoundIncrement}>Next Round</button></div> }
              </div>
            )
          }

          <div className="absolute">
            <ForceVisibleWhen when={roundNumber > 0}>
                <FloatingMenu 
                  neighborhood={neighborhood}
                  attacking={attacking}
                  onAttackClick={(playerIndex) => queueAttack(playerIndex)}
                />
            </ForceVisibleWhen>
            <InfoBubble direction="lowright" tooltipStyle={{position: "fixed", bottom: "25px", right: "105px", width: '160px'}}>
                <b className="small-caps">Attack</b>
                <br />
                Use this menu during the game to attack neighboring players with your elements.
            </InfoBubble>
          </div>
        </div>
    </TooltipProvider>
  );
};
