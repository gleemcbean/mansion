import type Anomaly from "@/utils/Anomaly";
import Doppelganger from "../../../game-server/src/assets/entities/Doppelganger";
import Phantom from "../../../game-server/src/assets/entities/Phantom";
import Tentacles from "../../../game-server/src/assets/entities/Tentacles";

export const ANOMALIES = new Map<string, typeof Anomaly>([
	["doppelganger", Doppelganger as typeof Anomaly],
	["phantom", Phantom as typeof Anomaly],
	["tentacles", Tentacles as typeof Anomaly],
]);
