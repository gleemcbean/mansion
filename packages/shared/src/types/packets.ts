import type { Anomaly } from "./anomalies";
import type { LobbyMetadata } from "./lobby";
import type { Client, PlayerData, PlayerGameData } from "./player";
import type { UUID } from "./util";

export enum ClientPacketType {
	Ready = "ready",
	HostGame = "host-game",
	CloseGame = "close-game",
	JoinGame = "join-game",
	LeaveGame = "leave-game",
	StartGame = "start-game",
	KickPlayer = "kick-player",
	PromotePlayer = "promote-player",
	PlayerUpdate = "player-update",
	DoorToggle = "door-toggle",
	RTCSignalOffer = "rtc-signal-offer",
	RTCSignalAnswer = "rtc-signal-answer",
	RTCSignalCandidate = "rtc-signal-candidate",
	VoiceSyllable = "voice-syllable",
}

export enum ServerPacketType {
	Initialize = "initialize",
	LobbyMetadataUpdate = "lobby-metadata-update",
	GameHosted = "game-hosted",
	GameClosed = "game-closed",
	GameJoined = "game-joined",
	GameLeft = "game-left",
	PlayerJoined = "player-joined",
	PlayerLeft = "player-left",
	Kicked = "kicked",
	GameStarted = "game-started",
	PlayerUpdate = "player-update",
	AnomalyUpdate = "anomaly-update",
	DoorToggle = "door-toggle",
	RoomUpdate = "room-update",
	RTCSignalOffer = "rtc-signal-offer",
	RTCSignalAnswer = "rtc-signal-answer",
	RTCSignalCandidate = "rtc-signal-candidate",
	Error = "error",
	InvalidCode = "invalid-code",
}

export type PacketType = ClientPacketType | ServerPacketType;

export type RTCIceCandidateInit = {
	candidate: string;
	sdpMid?: string | null;
	sdpMLineIndex?: number | null;
};

// biome-ignore format: Package needs to be inlined
export type ClientPacketMap = {
	[ClientPacketType.Ready]: {};
	[ClientPacketType.HostGame]: {};
	[ClientPacketType.CloseGame]: {};
	[ClientPacketType.JoinGame]: { code: string };
	[ClientPacketType.LeaveGame]: {};
	[ClientPacketType.StartGame]: {};
	[ClientPacketType.KickPlayer]: { uuid: UUID };
	[ClientPacketType.PromotePlayer]: { uuid: UUID };
	[ClientPacketType.PlayerUpdate]: { gameData: PlayerGameData };
	[ClientPacketType.DoorToggle]: { doorUuid: UUID, isOpen: boolean };
	[ClientPacketType.RTCSignalOffer]: { to: UUID; from: UUID; sdp: string };
	[ClientPacketType.RTCSignalAnswer]: { to: UUID; from: UUID; sdp: string };
	[ClientPacketType.RTCSignalCandidate]: { to: UUID; from: UUID; candidate: RTCIceCandidateInit };
	[ClientPacketType.VoiceSyllable]: { uuid: UUID; syllable: string }
};

// biome-ignore format: Package needs to be inlined
export type ServerPacketMap = {
	[ServerPacketType.Initialize]: { uuid: UUID; username: string };
	[ServerPacketType.LobbyMetadataUpdate]: { metadata: LobbyMetadata };
	[ServerPacketType.GameHosted]: { metadata: LobbyMetadata; players: Client[]; playerData: PlayerData };
	[ServerPacketType.GameClosed]: {};
	[ServerPacketType.GameJoined]: { metadata: LobbyMetadata; players: Client[]; playerData: PlayerData };
	[ServerPacketType.GameLeft]: {};
	[ServerPacketType.PlayerJoined]: { player: Client };
	[ServerPacketType.PlayerLeft]: { uuid: UUID };
	[ServerPacketType.Kicked]: {};
	[ServerPacketType.GameStarted]: { metadata: LobbyMetadata; gameData: PlayerGameData, anomalies: Anomaly[] };
	[ServerPacketType.PlayerUpdate]: { uuid: UUID; client: Client };
	[ServerPacketType.AnomalyUpdate]: { anomalyId: string, data: Omit<Anomaly, 'id'> };
	[ServerPacketType.DoorToggle]: { doorUuid: UUID, isOpen: boolean };
	[ServerPacketType.RoomUpdate]: { roomUuid: UUID };
	[ServerPacketType.RTCSignalOffer]: { from: UUID; sdp: string };
	[ServerPacketType.RTCSignalAnswer]: { from: UUID; sdp: string };
	[ServerPacketType.RTCSignalCandidate]: { from: UUID; candidate: RTCIceCandidateInit };
	[ServerPacketType.Error]: { message: string };
	[ServerPacketType.InvalidCode]: {};
};

export type PacketMap = ClientPacketMap | ServerPacketMap;
