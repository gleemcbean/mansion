import { createRoot } from "react-dom/client";
import App from "./App";
import useWebsocket from "./hooks/useWebsocket";
import Loading from "./ui/modals/Loading";
import "./ui/styles/global.scss";
import { extend } from "@react-three/fiber";
import { ShaderPass } from "postprocessing";

extend({ ShaderPass });

function Root() {
  const { open } = useWebsocket();

  if (!open) return <Loading />;
  return <App />;
}

document.oncontextmenu = (e) => e.preventDefault();
document.onkeydown = (e) => {
  if (e.key === "v") return;
  if (e.ctrlKey || e.metaKey || e.altKey) e.preventDefault();
};

createRoot(document.getElementById("root")!).render(<Root />);
