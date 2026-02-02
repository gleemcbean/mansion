import { forwardRef, useMemo, useRef, useState } from "react";
import Modal, { type ModalRef } from "../components/Modal";
import Options from "../pages/Options";
import useLobby from "@/hooks/useLobby";
import useClient from "@/hooks/useClient";
import useVoice from "@/hooks/useVoice";
import styles from "../styles/modules/modals/Menu.module.scss";

enum Page {
  Menu,
  Options,
}

export default forwardRef<ModalRef>(({}, ref) => {
  const [page, setPage] = useState(Page.Menu);
  const [selected, setSelected] = useState(0);
  const leaveGameModalRef = useRef<ModalRef | null>(null);
  const { setMetadata, fillPlayers } = useLobby();
  const { setClient, client } = useClient();
  const { exit } = useVoice();

  const leave = () => {
    setMetadata(null);
    fillPlayers([]);
    delete client.playerData;
    setClient(client);
    exit();
  };

  const options = useMemo(() => {
    return [
      {
        label: "Resume",
        execute: () => {
          document.querySelector("canvas")!.requestPointerLock();
        },
      },
      {
        label: "Options",
        execute: () => {
          setPage(Page.Options);
        },
      },
      {
        label: "Leave Game",
        execute: () => {
          leaveGameModalRef.current?.open();
        },
      },
    ];
  }, []);

  switch (page) {
    case Page.Menu:
      return (
        <Modal ref={ref} className={styles.container}>
          <h1 className={styles.title}>Menu</h1>
          <ul className={styles.menu}>
            {options.map((o, i) => (
              <li
                key={i}
                onClick={o.execute}
                onMouseEnter={() => setSelected(i)}
                className={`${styles.option}${
                  selected === i ? ` ${styles.selected}` : ""
                }`}
              >
                {o.label}
              </li>
            ))}
          </ul>
          <Modal ref={leaveGameModalRef} closeOnOutsideClick>
            <h1 className={styles.title}>Leave Game</h1>
            <p className={styles.leaveMessage}>
              Are you sure that you want to leave this game?
            </p>
            <div className={styles.buttons}>
              <button
                onClick={() => leaveGameModalRef.current?.close()}
                className={styles.noButton}
              >
                No
              </button>
              <button onClick={leave} className={styles.yesButton}>
                Yes
              </button>
            </div>
          </Modal>
        </Modal>
      );

    case Page.Options:
      return (
        <Modal ref={ref}>
          <Options back={() => setPage(Page.Menu)} />
        </Modal>
      );
  }
});
