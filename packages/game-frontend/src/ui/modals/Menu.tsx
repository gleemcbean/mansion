import { forwardRef, useMemo, useState } from "react";
import Modal, { type ModalRef } from "../components/Modal";
import Options from "../pages/Options";
import useLobby from "@/hooks/useLobby";
import useClient from "@/hooks/useClient";
import useVoice from "@/hooks/useVoice";

enum Page {
  Menu,
  Options,
}

export default forwardRef<ModalRef>(({}, ref) => {
  const [page, setPage] = useState(Page.Menu);
  const [selected, setSelected] = useState(0);
  const { setMetadata, fillPlayers } = useLobby();
  const { setClient, client } = useClient();
  const { exit } = useVoice();

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
          setMetadata(null);
          fillPlayers([]);
          delete client.playerData;
          setClient(client);
          exit();
        },
      },
    ];
  }, []);

  switch (page) {
    case Page.Menu:
      return (
        <Modal ref={ref}>
          <h1>Menu</h1>
          <ul>
            {options.map((o, i) => (
              <li key={i}>
                <button onClick={o.execute}>{o.label}</button>
              </li>
            ))}
          </ul>
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
