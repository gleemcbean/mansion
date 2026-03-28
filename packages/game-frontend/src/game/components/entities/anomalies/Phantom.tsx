import GameMap from "@mansion/shared/objects/map/GameMap";
import type { Anomaly } from "@mansion/shared/types/anomalies";
import { transform2dVec } from "@mansion/shared/utils/vectors";
import { useEffect } from "react";
import useLobby from "@/hooks/useLobby";

type PhantomProps = {
	data: Anomaly;
};

export default function Phantom({ data }: PhantomProps) {
	const { metadata } = useLobby();

	useEffect(() => {
		console.log(
			data,
			GameMap.fromJSON(metadata!.map).roomAt(transform2dVec(data.position)),
		);
	}, []);

	return null;
}
