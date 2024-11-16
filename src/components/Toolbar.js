import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { auth } from "../firebase-config";
import {serverTimestamp} from "firebase/firestore";
import { SyncCountdownTimer } from "./SyncCountdownTimer";

const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
    },
  };
export const Toolbar = ({ id, room, socket }) => {
  let subtitle;
  const [modalIsOpen, setIsOpen] = useState(false);
  const [isAutoProceed, setIsAutoProceed] = useState(false);
  const [serverTime, setServerTime] = useState(null);

  // function openModal() {
  //   setIsOpen(true);
  // }
  useEffect(() => {
    // Setup socket connection
    socket.on('syncTimer', (data) => {
      setServerTime(data.remainingTime);
    });

    // Cleanup
    return () => {
      socket.off('syncTimer');
    };
  }, []);

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    subtitle.style.color = '#f00';
  }

  function closeModal() {
    setIsOpen(false);
  }

  const handleRoundIncrement = async (event) => {
    event.preventDefault();

    //setIsAutoProceed(true);
    console.log("TRYING TO INCREMENT");

    socket.emit("nextRound", {
        createdAt: serverTimestamp(),
        userUid: auth.currentUser.uid,
        roomId: room,
        room
      })
  };

  const beginAutoProceeding = async (event) => {
    event.preventDefault();
    setIsAutoProceed(true);

    // socket.emit("startRoundTimer", {
    //     createdAt: serverTimestamp(),
    //     userUid: auth.currentUser.uid,
    //     roomId: room,
    //     room
    //   });

    socket.emit("startRoundTimer", {room: room})
  };


  const stopAutoProceeding = async (event) => {
    event.preventDefault();
    setIsAutoProceed(false);

    // socket.emit("stopRoundTimer", {
    //     createdAt: serverTimestamp(),
    //     userUid: auth.currentUser.uid,
    //     roomId: room,
    //     room
    //   });

    socket.emit("stopRoundTimer", {room: room})
  };

  return (
    <>
      {/* <div className="centered"><button onClick={openModal}>Convert</button></div> */}
      { isAutoProceed ?
        (<div>
          <div className="centered"><button onClick={stopAutoProceeding}>Stop</button></div> 
          <div className="centered">
            <SyncCountdownTimer
              duration={10}
              colors={['green', '#F7B801', '#ed6403', '#c50202']}
              colorsTime={[6, 4, 2, 1]}
              serverTimeRemaining={serverTime}
              onComplete={() => {
                // do your stuff here
                return { shouldRepeat: true, delay: 0 }
              }}
            />
          </div>
        </div>) :
        (<div className="centered"><button onClick={beginAutoProceeding}>Start</button></div> ) }
      {<div className="centered"><button onClick={handleRoundIncrement}>Next Round</button></div> }
      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        <h2 ref={(_subtitle) => (subtitle = _subtitle)}>Hello</h2>
        <button onClick={closeModal}>close</button>
        <div>I am a modal</div>
        <form>
          <input />
          <button>tab navigation</button>
          <button>stays</button>
          <button>inside</button>
          <button>the modal</button>
        </form>
      </Modal>
    </>
  );
};
