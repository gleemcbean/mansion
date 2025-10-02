import { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Lobby from "./pages/Lobby";
import Options from "./pages/Options";

export enum Page {
  Landing,
  Lobby,
  Options,
}

export default function Router() {
  const [page, setPage] = useState<Page>(Page.Landing);

  useEffect(() => {
    window.history.pushState({ page }, "", "");

    const onPopState = (event: PopStateEvent) => {
      if (event.state && typeof event.state.page === "number") {
        setPage(event.state.page);
      } else {
        setPage(Page.Landing);
      }
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [page]);

  switch (page) {
    case Page.Landing:
      return <Landing setPage={setPage} />;
    case Page.Lobby:
      return <Lobby back={() => setPage(Page.Landing)} />;
    case Page.Options:
      return <Options back={() => setPage(Page.Landing)} />;
    default:
      throw new Error("Unknown page");
  }
}
