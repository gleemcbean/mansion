import type { Anomaly as AnomalyType } from "@mansion/shared/types/anomalies";
import React from "react";
import useLobby from "@/hooks/useLobby";
import Doppelganger from "../entities/anomalies/Doppelganger";
import Phantom from "../entities/anomalies/Phantom";
import Tentacles from "../entities/anomalies/Tentacles";

export default function AnomalyManager() {
	const { anomalies } = useLobby();

	return (
		<React.Fragment>
			{anomalies.map((anomaly, index) => {
				let Anomaly: ({
					data,
					key,
				}: {
					data: AnomalyType;
					key: string;
				}) => React.ReactNode;

				switch (anomaly.id) {
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

				return <Anomaly key={`${anomaly.id}${index}`} data={anomaly} />;
			})}
		</React.Fragment>
	);
}
