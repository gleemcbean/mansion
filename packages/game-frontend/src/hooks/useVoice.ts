import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import type { UUID } from "@mansion/shared/types/util";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";
import {
	localStreamAtom,
	mutedPlayers,
	playerAudioStreamsAtom,
	playerRTCsAtom,
	playerVolumesAtom,
} from "@/stores/jotaiStore";
import useClient from "./useClient";
import useLobby from "./useLobby";
import useWebsocket from "./useWebsocket";

const ICE_CONFIG: RTCConfiguration = {
	iceServers: [
		{ urls: "stun:stun.l.google.com:19302" },
		{ urls: "stun:stun1.l.google.com:19302" },
		{ urls: "stun:stun2.l.google.com:19302" },
		{ urls: "stun:stun3.l.google.com:19302" },
		{ urls: "stun:stun4.l.google.com:19302" },
	],
};

export default function useVoice() {
	const [_localStream, setLocalStream] = useAtom(localStreamAtom);
	const [streams, setStreams] = useAtom(playerAudioStreamsAtom);
	const [_peers, setPeers] = useAtom(playerRTCsAtom);
	const [volumes, setVolumes] = useAtom(playerVolumesAtom);
	const [muted, setMuted] = useAtom(mutedPlayers);
	const { client, options } = useClient();
	const { players } = useLobby();
	const { send, addHandler } = useWebsocket();

	const audioCtx = useRef<AudioContext | null>(null);
	const globalGainNode = useRef<GainNode | null>(null);
	const playerNodes = useRef(new Map<UUID, GainNode>());

	const localStream = useRef(_localStream);
	const peers = useRef(_peers);
	localStream.current = _localStream;
	peers.current = _peers;

	const updateStream = (uuid: UUID, stream: MediaStream) => {
		setStreams((prev) => {
			const next = new Map(prev);
			next.set(uuid, stream);
			return next;
		});

		if (!playerNodes.current.has(uuid)) {
			const source = audioCtx.current!.createMediaStreamSource(stream);
			const gainNode = audioCtx.current!.createGain();
			gainNode.gain.value = muted.has(uuid) ? 0 : (volumes.get(uuid) ?? 1);
			source.connect(gainNode).connect(audioCtx.current!.destination);
			playerNodes.current.set(uuid, gainNode);

			const audioElement = document.createElement("audio");
			audioElement.srcObject = stream;
			audioElement.autoplay = true;
			audioElement.muted = true;
			audioElement.play().catch(console.error);
		}
	};

	const createPeer = async (uuid: UUID) => {
		if (!localStream.current) throw new Error("No local stream");
		const pc = new RTCPeerConnection(ICE_CONFIG);

		localStream.current!.getTracks().forEach((track) => {
			track.enabled = !options.muted;
			pc.addTrack(track, localStream.current!);
		});

		pc.ontrack = (event) => {
			const [stream] = event.streams ?? new MediaStream([event.track]);
			if (!stream) return console.warn("No stream found for incoming track");

			updateStream(uuid, stream);
		};

		pc.onicecandidate = (event) => {
			if (!event.candidate) return;

			send(ClientPacketType.RTCSignalCandidate, {
				from: client.uuid,
				to: uuid,
				candidate: event.candidate,
			});
		};

		pc.onconnectionstatechange = () => {
			if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
				closeConnection(uuid);
				console.warn(`Connection to ${uuid} closed: ${pc.connectionState}`);
			}
		};

		peers.current.set(uuid, pc);
		setPeers(new Map(peers.current));

		return pc;
	};

	const ensureConnection = async (uuid: UUID) => {
		if (peers.current.has(uuid) || uuid <= client.uuid) return;

		const pc = await createPeer(uuid);
		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		send(ClientPacketType.RTCSignalOffer, {
			from: client.uuid,
			to: uuid,
			sdp: offer.sdp!,
		});
	};

	const closeConnection = (uuid: UUID) => {
		const pc = peers.current.get(uuid);
		if (!pc) return;
		pc.close();
		peers.current.delete(uuid);

		setPeers(new Map(peers.current));
		setStreams((prev) => {
			const next = new Map(prev);
			next.delete(uuid);
			return next;
		});
	};

	const exit = () => {
		peers.current.forEach((pc) => {
			pc.close();
		});

		setPeers(new Map());
		setStreams(new Map());
	};

	const getLocalStream = async () => {
		if (localStream.current) return;

		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					channelCount: 2,
					sampleRate: 48000,
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
				},
				video: false,
			});

			if (!stream) throw new Error("No stream");
			setLocalStream(stream);
		} catch (e) {
			console.error("Failed to get local stream", e);
			return null;
		}
	};

	const getPlayerVolume = useCallback(
		(uuid: UUID) => {
			return volumes.get(uuid) ?? 1;
		},
		[volumes],
	);

	const isPlayerMuted = useCallback(
		(uuid: UUID) => {
			return muted.has(uuid);
		},
		[muted],
	);

	const setPlayerVolume = (uuid: UUID, volume: number) => {
		setVolumes((prev) => {
			const next = new Map(prev);
			next.set(uuid, volume);
			return next;
		});

		const node = playerNodes.current.get(uuid) as GainNode;
		if (node) node.gain.value = muted.has(uuid) ? 0 : volume;
	};

	const togglePlayerMute = (uuid: UUID) => {
		setMuted((prev) => {
			const next = new Set(prev);
			if (next.has(uuid)) next.delete(uuid);
			else next.add(uuid);
			return next;
		});

		const node = playerNodes.current.get(uuid);
		if (node) node.gain.value = muted.has(uuid) ? (volumes.get(uuid) ?? 1) : 0;
	};

	useEffect(() => {
		getLocalStream();

		if (audioCtx.current) return;
		audioCtx.current = new AudioContext();

		globalGainNode.current = audioCtx.current.createGain();
		globalGainNode.current.gain.value = 0;
		globalGainNode.current.connect(audioCtx.current.destination);

		audioCtx.current.resume();

		const unsubscribes = [
			addHandler(ServerPacketType.RTCSignalOffer, async ({ from, sdp }) => {
				await getLocalStream();

				const pc = await createPeer(from);

				await pc.setRemoteDescription(
					new RTCSessionDescription({ type: "offer", sdp }),
				);

				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);

				send(ClientPacketType.RTCSignalAnswer, {
					from: client.uuid,
					to: from,
					sdp: answer.sdp!,
				});
			}),
			addHandler(ServerPacketType.RTCSignalAnswer, async ({ from, sdp }) => {
				const pc = peers.current.get(from);
				if (!pc || !sdp) return;

				await pc.setRemoteDescription(
					new RTCSessionDescription({ type: "answer", sdp }),
				);
			}),
			addHandler(
				ServerPacketType.RTCSignalCandidate,
				async ({ from, candidate }) => {
					const pc = peers.current.get(from);
					if (!pc) return;
					await pc.addIceCandidate(new RTCIceCandidate(candidate));
				},
			),
		];

		return () => {
			unsubscribes.forEach((u) => {
				u();
			});
		};
	}, []);

	useEffect(() => {
		if (!localStream.current || !audioCtx.current) return;

		players.forEach((p) => {
			ensureConnection(p.uuid);
		});

		peers.current.forEach((_pc, uuid) => {
			if (!players.has(uuid)) closeConnection(uuid);
		});
	}, [players, localStream.current, audioCtx.current]);

	useEffect(() => {
		if (!localStream.current || !audioCtx.current) return;
		if (audioCtx.current.state === "suspended") audioCtx.current.resume();

		localStream.current.getAudioTracks().forEach((track) => {
			track.enabled = !options.muted;
		});
	}, [options.muted]);

	useEffect(() => {
		if (!globalGainNode.current) return;
		globalGainNode.current.gain.value = options.volume / 50;
	}, [options.volume]);

	return {
		streams,
		closeConnection,
		exit,
		setPlayerVolume,
		togglePlayerMute,
		getPlayerVolume,
		isPlayerMuted,
	};
}
