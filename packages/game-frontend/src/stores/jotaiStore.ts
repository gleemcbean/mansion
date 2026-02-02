import type { LobbyMetadata } from "@mansion/shared/types/lobby";
import type {
	ServerPacketMap,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import type { Client, PlayerGameData } from "@mansion/shared/types/player";
import type { UUID } from "@mansion/shared/types/util";
import type Anomaly from "@mansion/shared/utils/Anomaly";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { DEFAULT_OPTIONS } from "@/constants/Options";

export type PacketCallback = (d: ServerPacketMap[ServerPacketType]) => void;
export type PacketSet = Set<PacketCallback>;

export const lobbyMetadataAtom = atom<LobbyMetadata | null>(null);
export const playersAtom = atom<Map<UUID, Client>>(new Map());
export const anomaliesAtom = atom<Anomaly[]>([]);

export const localStreamAtom = atom<MediaStream | null>(null);
export const playerRTCsAtom = atom<Map<UUID, RTCPeerConnection>>(new Map());
export const playerAudioStreamsAtom = atom<Map<UUID, MediaStream>>(new Map());
export const playerVolumesAtom = atom<Map<UUID, number>>(new Map());
export const mutedPlayers = atom<Set<UUID>>(new Set<UUID>());

export const clientAtom = atom<Client | null>(null);
export const optionsAtom = atomWithStorage("options", DEFAULT_OPTIONS);
export const gameDataAtom = atom<PlayerGameData | null>(null);
export const roomAtom = atom("");

export const wsAtom = atom<WebSocket | null>(null);
export const wsHandlersAtom = atom(new Map<ServerPacketType, PacketSet>());
