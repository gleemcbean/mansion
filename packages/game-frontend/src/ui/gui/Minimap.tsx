import { useEffect, useState } from "react";
import useClient from "@/hooks/useClient";
import useLobby from "@/hooks/useLobby";
import PlayerIcon from "../components/PlayerIcon";
import styles from "../styles/modules/gui/Minimap.module.scss";

type MinimapGameData = {
	viewBox: string;
	mapRotation: string;
	textRotation: number;
};

type MinimapProps = {
	size?: number;
};

const STROKE = 0.1;

export default function Minimap({ size = 250 }: MinimapProps) {
	const { map } = useLobby();
	const { client, room, subGameData } = useClient();
	const [gameData, setGameData] = useState<MinimapGameData>({
		viewBox: "0 0 0 0",
		mapRotation: "rotate(0 0 0)",
		textRotation: 0,
	});

	useEffect(() => {
		const unsubscribe = subGameData((data) => {
			const { 0: px, 2: pz } = data.position;
			const [qx, qy, qz, qw] = data.quaternion;
			const sinyCosp = 2 * (qw * qy + qx * qz);
			const cosyCosp = 1 - 2 * (qy * qy + qz * qz);
			const rotation = Math.atan2(sinyCosp, cosyCosp);
			const rotationDeg = (rotation * 180) / Math.PI;

			setGameData({
				viewBox: `${px - 5} ${pz - 5} 10 10`,
				mapRotation: `rotate(${rotationDeg} ${px} ${pz})`,
				textRotation: -rotationDeg,
			});
		});

		return () => unsubscribe();
	}, []);

	return (
		gameData && (
			<div className={styles.container}>
				<div className={styles.minimap}>
					<svg width={size} height={size} viewBox={gameData.viewBox}>
						<title>Minimap</title>
						<g transform={gameData.mapRotation}>
							{map?.rooms.map((room) => {
								const points = room.t_topology
									.map(([x, y]) => `${x},${y}`)
									.join(" ");

								return (
									<polygon
										key={points}
										points={points}
										fill="#6cebeb22"
										stroke="#6cebeb"
										strokeWidth={STROKE}
									/>
								);
							})}
							{map?.doors.map(
								(door) =>
									door.openable && (
										<rect
											key={door.position.toString()}
											x={
												door.position[0] -
												(door.direction % 2 === 0 ? 0.5 : STROKE)
											}
											y={
												door.position[1] -
												(door.direction % 2 === 0 ? STROKE : 0.5)
											}
											width={door.direction % 2 === 0 ? 1 : STROKE * 2}
											height={door.direction % 2 === 0 ? STROKE * 2 : 1}
											fill="#ffd000"
										/>
									),
							)}
						</g>
					</svg>
					<PlayerIcon
						owner={false}
						color={client.playerData!.mushroomCapColor}
						className={styles.icon}
					/>
				</div>
				<h3 className={styles.room}>{room}</h3>
			</div>
		)
	);
}
