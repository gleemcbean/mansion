import { ClientPacketType } from "@mansion/shared/types/packets";
import EventHandler from "@/EventHandler";

export default new EventHandler(
	ClientPacketType.VoiceSyllable,
	(_ws, { uuid, syllable }) => {
		console.log(`Received syllable from ${uuid}: ${syllable}`);
	},
);
