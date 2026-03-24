import { ClientPacketType } from "@mansion/shared/types/packets";
import EventHandler from "@/EventHandler";

export default new EventHandler(
	ClientPacketType.DoorToggle,
	(ws, { doorId, isOpen }) => {},
);
