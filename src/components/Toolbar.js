import { useState } from 'react';
import Modal from 'react-modal';
import socketIOClient from "socket.io-client";
import { auth } from "../firebase-config";
import {serverTimestamp} from "firebase/firestore";

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
export const Toolbar = (room, isAutoProceeding) => {
  let socketio  = socketIOClient("http://localhost:5001")
  let subtitle;
  const [modalIsOpen, setIsOpen] = useState(false);

  function openModal() {
    setIsOpen(true);
  }

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    subtitle.style.color = '#f00';
  }

  function closeModal() {
    setIsOpen(false);
  }

  const handleRoundIncrement = async (event) => {
    event.preventDefault();

    socketio.emit("nextRound", {
        createdAt: serverTimestamp(),
        userUid: auth.currentUser.uid,
        room,
      })
  };

  const beginAutoProceeding = async (event) => {
    event.preventDefault();

    socketio.emit("startRoundTimer", {
        createdAt: serverTimestamp(),
        userUid: auth.currentUser.uid,
        room,
      })
  };

  return (
    <>
      <div className="centered"><button onClick={openModal}>Convert</button></div>
      { !isAutoProceeding ?
        (<div className="centered"><button onClick={handleRoundIncrement}>Next Roundz</button></div> ) :
        (<div className="centered"><button onClick={beginAutoProceeding}>Start</button></div> )}
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
