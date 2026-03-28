import type { Anomaly as AnomalyType } from "@mansion/shared/types/anomalies";
import { ServerPacketType } from "@mansion/shared/types/packets";
import React, { useEffect, useState } from "react";
import useLobby from "@/hooks/useLobby";
import useWebsocket from "@/hooks/useWebsocket";
import Doppelganger from "../entities/anomalies/Doppelganger";
import Phantom from "../entities/anomalies/Phantom";
import Tentacles from "../entities/anomalies/Tentacles";

export default function AnomalyManager() {
	const { anomalies: _anomalies } = useLobby();
	const { addHandler } = useWebsocket();
	const [anomalies, setAnomalies] = useState(_anomalies);

	useEffect(() => {
		const unsubscribe = addHandler(
			ServerPacketType.AnomalyUpdate,
			({ anomalyId, data }) => {
				anomalies.set(anomalyId, data);
				setAnomalies(new Map(anomalies));
			},
		);

		return unsubscribe;
	}, []);

	return (
		<React.Fragment>
			{Array.from(anomalies.entries()).map(([anomalyId, anomaly]) => {
				let Anomaly: ({
					data,
					key,
				}: {
					data: AnomalyType;
					key: string;
				}) => React.ReactNode;

				switch (anomalyId) {
					case "tentacles":
						Anomaly = Tentacles;
						break;

					case "doppelganger":
						Anomaly = Doppelganger;
						break;

					case "phantom":
						Anomaly = Phantom;
						break;

					default:
						throw new Error("Unknown anomaly ID.");
				}

				return <Anomaly key={anomaly.id} data={anomaly} />;
			})}
		</React.Fragment>
	);
}
