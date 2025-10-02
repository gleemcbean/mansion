import useWebsocket from "@/hooks/useWebsocket";
import {
  ClientPacketType,
  ServerPacketType,
} from "@mansion/shared/types/packets";
import { forwardRef, useEffect, useState } from "react";
import Modal, { type ModalRef } from "../components/Modal";
import styles from "../styles/modules/modals/Join.module.scss";
import useLobby from "@/hooks/useLobby";
import useClient from "@/hooks/useClient";

const CODE_LENGTH = 6;

export default forwardRef<ModalRef>((_props, ref) => {
  const [code, setCode] = useState("");
  const { send, addHandler } = useWebsocket();
  const { setMetadata, fillPlayers } = useLobby();
  const { client, setClient } = useClient();

  useEffect(() => {
    const unsubscribes = [
      addHandler(ServerPacketType.Error, ({ message }) => {
        alert(message);
      }),
      addHandler(
        ServerPacketType.GameJoined,
        ({ metadata, players, playerData }) => {
          setMetadata(metadata);
          fillPlayers(players);
          client.playerData = playerData;
          setClient(client);
          close();
        }
      ),
    ];

    return () => unsubscribes.forEach((u) => u());
  }, []);

  const changeCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCode(value.slice(0, CODE_LENGTH));
  };

  const joinLobby = () => {
    if (code.length < CODE_LENGTH) return;
    send(ClientPacketType.JoinGame, { code });
  };

  const close = () => (ref as React.RefObject<ModalRef>)?.current?.close();

  return (
    <Modal ref={ref} closeOnOutsideClick>
      <h4 className={styles.label}>Game code: </h4>
      <input
        type="text"
        placeholder={"X".repeat(CODE_LENGTH)}
        className={styles.codeInput}
        maxLength={CODE_LENGTH}
        value={code}
        onChange={changeCode}
        spellCheck={false}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        pattern="[A-Z0-9]{6}"
        inputMode="text"
        autoFocus
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") joinLobby();
          if (e.key === "Escape") close();
        }}
      />
      <div className={styles.buttons}>
        <button className={styles.button} onClick={close}>
          Cancel
        </button>
        <button
          className={`${styles.button} ${styles.join}`}
          disabled={code.length < CODE_LENGTH}
          onClick={joinLobby}
        >
          Join
        </button>
      </div>
    </Modal>
  );
});
