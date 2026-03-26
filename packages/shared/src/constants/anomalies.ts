import type Anomaly from "@/utils/Anomaly";
import Doppelganger from "./entities/Doppelganger";
import Phantom from "./entities/Phantom";
import Tentacles from "./entities/Tentacles";

export const SYLLABLES = [
	"ABA",
	"LABI",
	"LIS",
	"EKO",
	"DIS",
	"CI",
	"KA",
	"BOO",
	"OUM",
	"GEN",
];

export const ANOMALIES = new Map<string, typeof Anomaly>([
	["doppelganger", Doppelganger as typeof Anomaly],
	["phantom", Phantom as typeof Anomaly],
	["tentacles", Tentacles as typeof Anomaly],
]);
