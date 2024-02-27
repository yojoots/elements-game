import { useEffect, useState } from 'react';
import Modal from 'react-modal';

// import { motion } from 'framer-motion';
//import { FiChevronRight } from 'react-icons/fi';

// // import { useModal } from '@/modules/modal';

// import MarketButton from './MarketButton';
// import SpellsButton from './SpellsButton';
// import OrdererButton from './Orderer';
// import AttackButton from './AttackButton';
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
export const Toolbar = () => {
    let subtitle;
  //const { openModal } = useModal();
  const { width } = 2500;

  const [opened, setOpened] = useState(false);
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
  useEffect(() => {
    if (width >= 1024) setOpened(true);
    else setOpened(false);
  }, [width]);

  //const handleShare = () => openModal(<ShareModal />);

  return (
    <>
      {/* <button
        className="btn-icon absolute bottom-1/2 -left-2 z-50 h-10 w-10 rounded-full bg-black text-2xl transition-none lg:hidden mx-2"
        animate={{ rotate: opened ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setOpened(!opened)}
      >
        &gt;
      </button>
      <div
        className="absolute left-10 top-[50%] z-50 grid grid-cols-2 items-center gap-5 rounded-lg bg-zinc-900 p-5 text-white 2xl:grid-cols-1"
        animate={{
          x: opened ? 0 : -160,
          y: '-50%',
        }}
        transition={{
          duration: 0.2,
        }}
      >
        <MarketButton />
        <SpellsButton />
        <OrdererButton />
        <AttackButton />
        <button>Hi</button>
        <div className="h-px w-full bg-white 2xl:hidden" />
        <div className="h-px w-full bg-white" />
      </div>*/}
      <button onClick={openModal}>Convert</button>
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
