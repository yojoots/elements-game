import { useState } from 'react';
import Modal from 'react-modal';
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
export const Toolbar = ({ room, socket }) => {
  let subtitle;
  const [modalIsOpen, setIsOpen] = useState(false);
  const [isAutoProceed, setIsAutoProceed] = useState(false);

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

    setIsAutoProceed(true);
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
      <div className="centered"><button onClick={openModal}>Convert</button></div>
      { isAutoProceed ?
        (<div className="centered"><button onClick={stopAutoProceeding}>Stop</button></div> ) :
        (<div className="centered"><button onClick={beginAutoProceeding}>Start</button></div> ) }
      {<div className="centered"><button onClick={handleRoundIncrement}>Next Roundz</button></div> }
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
