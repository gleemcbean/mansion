import { LB_MIN_PLAYERS } from "@mansion/shared/constants/lobby";
import GameMap from "@mansion/shared/objects/map/GameMap";
import type { LobbyMetadata } from "@mansion/shared/types/lobby";
import {
	ClientPacketType,
	ServerPacketType,
} from "@mansion/shared/types/packets";
import type { Client } from "@mansion/shared/types/player";
import type { UUID } from "@mansion/shared/types/util";
import React, { useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCaretLeft, FaCaretRight, FaCheck } from "react-icons/fa";
import { ImBlocked } from "react-icons/im";
import {
	IoMdMic,
	IoMdMicOff,
	IoMdVolumeHigh,
	IoMdVolumeOff,
} from "react-icons/io";
import { IoCopy } from "react-icons/io5";
import { RiVipCrownFill } from "react-icons/ri";
import { PulseLoader } from "react-spinners";
import type { DEFAULT_OPTIONS } from "@/constants/Options";
import useClient from "@/hooks/useClient";
import useLobby from "@/hooks/useLobby";
import useVoice from "@/hooks/useVoice";
import useWebsocket from "@/hooks/useWebsocket";
import Container from "../components/Container";
import PlayerIcon from "../components/PlayerIcon";
import Loading from "../modals/Loading";
import styles from "../styles/modules/pages/Lobby.module.scss";

type PlayerShape = {
	top: string;
	left: string;
	width: string;
	height: string;
} | null;

type PlayerItemProps = {
	player: Client;
	isMe: boolean;
	iAmOwner: boolean;
	metadata: LobbyMetadata;
	options: typeof DEFAULT_OPTIONS;
	volume: number;
	muted: boolean;
	hover: (e: React.MouseEvent<HTMLElement, MouseEvent>) => void;
	setOption: (
		key: keyof typeof DEFAULT_OPTIONS,
		value: boolean | number | [string, string],
	) => void;
	setVolume: (volume: number) => void;
	toggleMute: () => void;
	kick: () => void;
	promote: () => void;
};

type LobbyProps = {
	back: () => void;
};

const X_OFFSET = 10;
const Y_OFFSET = 4;

function PlayerItem({
	player,
	isMe,
	iAmOwner,
	metadata,
	options,
	volume,
	muted,
	hover,
	setOption,
	setVolume,
	toggleMute,
	kick,
	promote,
}: PlayerItemProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const [showActions, setShowActions] = useState(false);

	const decrease = () => {
		const newValue = Math.round(Math.max(volume - 0.1, 0) * 10) / 10;
		setVolume(newValue);
	};

	const increase = () => {
		const newValue = Math.round(Math.min(volume + 0.1, 2) * 10) / 10;
		setVolume(newValue);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				buttonRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!buttonRef.current.contains(event.target as Node)
			) {
				setShowActions(false);
			}
		};

		if (showActions) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [showActions]);

	return (
		<div
			key={player.uuid}
			onMouseEnter={hover}
			className={`${styles.player} ${isMe ? styles.me : ""}`}
		>
			<PlayerIcon
				color={player.playerData!.mushroomCapColor}
				className={styles.icon}
				owner={player.uuid === metadata!.ownerUUID}
			/>
			<p className={styles.username}>{player.username}</p>
			<div className={styles.playerControls}>
				{!isMe && (
					<React.Fragment>
						<div className={styles.sliderBox}>
							<button
								type="button"
								className={styles.decreaseButton}
								onClick={decrease}
							>
								<FaCaretLeft size={20} />
							</button>
							<div className={styles.sliderContainer}>
								<input
									className={styles.slider}
									type="range"
									min={0}
									max={2}
									step={0.1}
									value={volume}
									onChange={(e) => setVolume(Number(e.target.value))}
								/>
								<span
									className={styles.valueProgress}
									style={{ width: `${(volume / 2) * 100}%` }}
								/>
							</div>
							<button
								type="button"
								className={styles.decreaseButton}
								onClick={increase}
							>
								<FaCaretRight size={20} />
							</button>
						</div>
						<button
							type="button"
							className={styles.button}
							onClick={toggleMute}
						>
							{muted ? (
								<IoMdVolumeOff size={20} />
							) : (
								<IoMdVolumeHigh size={20} />
							)}
						</button>
						{iAmOwner && (
							<React.Fragment>
								<button
									type="button"
									className={styles.button}
									onClick={() => setShowActions(!showActions)}
									ref={buttonRef}
								>
									<BsThreeDotsVertical size={20} />
								</button>
								<div
									className={`${styles.actionMenu}${
										showActions ? ` ${styles.visible}` : ""
									}`}
									ref={menuRef}
								>
									<button
										type="button"
										className={styles.action}
										onClick={promote}
									>
										<RiVipCrownFill size={18} className={styles.actionIcon} />
										<span className={styles.label}>Promote</span>
									</button>
									<button
										type="button"
										className={`${styles.action} ${styles.danger}`}
										onClick={kick}
									>
										<ImBlocked size={18} className={styles.actionIcon} />
										<span className={styles.label}>Kick</span>
									</button>
								</div>
							</React.Fragment>
						)}
					</React.Fragment>
				)}
				{isMe && (
					<button
						type="button"
						className={styles.button}
						onClick={() => setOption("muted", !options.muted)}
					>
						{options.muted ? <IoMdMicOff size={19} /> : <IoMdMic size={19} />}
					</button>
				)}
			</div>
		</div>
	);
}

export default function Lobby({ back }: LobbyProps) {
	const [copied, setCopied] = useState(false);
	const { client, options, setClient, setOption } = useClient();
	const { addHandler, send } = useWebsocket();
	const [playerShape, setPlayerShape] = useState<PlayerShape>(null);
	const {
		opened,
		metadata,
		players,
		setMetadata,
		fillPlayers,
		addPlayer,
		removePlayer,
		fillAnomalies,
		setMap,
	} = useLobby();
	const {
		isPlayerMuted,
		getPlayerVolume,
		setPlayerVolume,
		togglePlayerMute,
		exit,
	} = useVoice();

	const hover = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
		const bounds = e.currentTarget.getBoundingClientRect();

		setPlayerShape({
			top: `${bounds.top - Y_OFFSET}px`,
			left: `${bounds.left - X_OFFSET}px`,
			width: `${bounds.width + X_OFFSET * 2}px`,
			height: `${bounds.height + Y_OFFSET * 2}px`,
		});
	};

	const copyCode = () => {
		if (!opened) return;
		const url = new URL(window.location.href);
		url.pathname = `/${metadata!.code}`;

		navigator.clipboard.writeText(
			`Game code: ${metadata!.code}\n${url.toString()}`,
		);

		setCopied(true);
		setTimeout(() => setCopied(false), 2_000);
	};

	const startGame = () => {
		if (!opened) return;
		send(ClientPacketType.StartGame);
	};

	const closeLobby = () => {
		if (!opened) return;

		if (metadata!.ownerUUID === client.uuid) {
			send(ClientPacketType.CloseGame);
		} else {
			send(ClientPacketType.LeaveGame);
		}

		exit();
		setMetadata(null);
		back();
	};

	const kickPlayer = (uuid: UUID) => {
		send(ClientPacketType.KickPlayer, { uuid });
	};

	const promotePlayer = (uuid: UUID) => {
		send(ClientPacketType.PromotePlayer, { uuid });
	};

	useEffect(() => {
		const unsubscribes = [
			addHandler(
				ServerPacketType.GameHosted,
				({ metadata, players, playerData }) => {
					setMetadata(metadata);
					fillPlayers(players);
					client.playerData = playerData;
					setClient(client);
				},
			),
			addHandler(ServerPacketType.GameClosed, () => {
				exit();
				setMetadata(null);
				back();
			}),
			addHandler(ServerPacketType.PlayerJoined, ({ player }) => {
				addPlayer(player);
			}),
			addHandler(ServerPacketType.PlayerLeft, ({ uuid }) => {
				removePlayer(uuid);
			}),
			addHandler(ServerPacketType.LobbyMetadataUpdate, ({ metadata }) => {
				setMetadata(metadata);
			}),
			addHandler(ServerPacketType.Kicked, () => {
				exit();
				setMetadata(null);
				back();
			}),
			addHandler(
				ServerPacketType.GameStarted,
				({ metadata, map, gameData, anomalies }) => {
					setMetadata(metadata);
					setMap(GameMap.fromJSON(map));
					fillAnomalies(anomalies);
					client.playerData!.gameData = gameData;
				},
			),
		];

		if (!opened) send(ClientPacketType.HostGame);

		return () => {
			unsubscribes.forEach((u) => {
				u();
			});
		};
	}, []);

	if (!opened) return <Loading />;

	return (
		<Container>
			<h1 className={styles.title}>Lobby</h1>
			<div className={styles.playerList}>
				{playerShape && (
					<span className={styles.playerSelector} style={playerShape} />
				)}
				<div className={styles.players}>
					{Array.from(players.values()).map((p) => (
						<PlayerItem
							key={p.uuid}
							player={p}
							isMe={p.uuid === client.uuid}
							iAmOwner={metadata!.ownerUUID === client.uuid}
							metadata={metadata!}
							options={options}
							hover={hover}
							setOption={setOption}
							volume={getPlayerVolume(p.uuid)}
							setVolume={(volume) => setPlayerVolume(p.uuid, volume)}
							muted={isPlayerMuted(p.uuid)}
							toggleMute={() => togglePlayerMute(p.uuid)}
							kick={() => kickPlayer(p.uuid)}
							promote={() => promotePlayer(p.uuid)}
						/>
					))}
				</div>
				{players.size < LB_MIN_PLAYERS && (
					<div className={styles.waitingContainer}>
						<PulseLoader size={8} color="#aaaaaa" speedMultiplier={0.8} />
						<p className={styles.waiting}>
							Waiting {LB_MIN_PLAYERS - players.size} more{" "}
							{LB_MIN_PLAYERS - players.size === 1 ? "player" : "players"} to
							join
						</p>
					</div>
				)}
			</div>
			<div className={styles.controls}>
				<div className={styles.codeContainer}>
					<h4>Game code</h4>
					<button
						type="button"
						className={styles.codeButton}
						onClick={copyCode}
					>
						<span>{metadata!.code}</span>
						{copied ? (
							<FaCheck size={20} className={styles.check} />
						) : (
							<IoCopy size={20} />
						)}
					</button>
				</div>
				{metadata!.ownerUUID === client.uuid ? (
					<React.Fragment>
						<button
							type="button"
							className={styles.startButton}
							disabled={players.size < LB_MIN_PLAYERS}
							onClick={startGame}
						>
							Start Game
						</button>
						<button
							type="button"
							className={styles.backButton}
							onClick={closeLobby}
						>
							Close Lobby
						</button>
					</React.Fragment>
				) : (
					<button
						type="button"
						className={styles.backButton}
						onClick={closeLobby}
					>
						Leave Lobby
					</button>
				)}
			</div>
		</Container>
	);
}
