import { type Anomaly, AnomalyState } from "@mansion/shared/types/anomalies";
import type { Light } from "@mansion/shared/types/map";
import { ServerPacketType } from "@mansion/shared/types/packets";
import { useEffect, useMemo, useRef } from "react";
import useLobby from "@/hooks/useLobby";
import useWebsocket from "@/hooks/useWebsocket";

type PhantomProps = {
	data: Anomaly;
};

function makeAnimation({
	frames,
	loop = true,
	onDone,
}: {
	frames: { action: () => void; duration: number | [number, number] }[];
	loop?: boolean;
	onDone?: () => void;
}) {
	let stopped = false;
	let timer: NodeJS.Timeout | null = null;

	function resolveDuration(duration: number | [number, number]) {
		if (Array.isArray(duration)) {
			const [min, max] = duration;
			return Math.round(min + Math.random() * (max - min));
		}

		return duration;
	}

	function runFrame(index: number) {
		if (stopped) return;

		const frame = frames[index];
		frame.action();
		const delay = resolveDuration(frame.duration);
		const next = index + 1;

		if (next < frames.length) {
			timer = setTimeout(() => runFrame(next), delay);
		} else if (loop) {
			timer = setTimeout(() => runFrame(0), delay);
		} else {
			onDone?.();
		}
	}

	runFrame(0);

	return {
		stop: () => {
			stopped = true;
			clearTimeout(timer!);
		},
	};
}

export default function Phantom({ data }: PhantomProps) {
	const { map, setMap } = useLobby();
	const { addHandler } = useWebsocket();
	const animation = useRef<ReturnType<typeof makeAnimation> | null>(null);

	const room = useMemo(() => {
		return map!.getRoom(data.entity_data.roomUUID);
	}, [data.entity_data.roomUUID]);

	const updateLights = (lightData: Partial<Light>) => {
		if (!room) return;

		room.lights = room.lights.map((light) => ({
			...light,
			...lightData,
		}));

		setMap(map!.clone());
	};

	useEffect(() => {
		if (!room) return;

		const unsubscribe = addHandler(
			ServerPacketType.AnomalyUpdate,
			({ anomalyId, data: newData }) => {
				if (anomalyId !== data.id) return;
				animation.current?.stop();

				switch (newData.state) {
					case AnomalyState.Roam:
						updateLights({ visible: true, color: 0xe8a7f0, intensity: 4 });
						break;

					case AnomalyState.Move:
						animation.current = makeAnimation({
							loop: true,
							frames: [
								{
									action: () =>
										updateLights({
											visible: true,
											color: 0xe8a7f0,
											intensity: 1,
										}),
									duration: [60, 480],
								},
								{
									action: () =>
										updateLights({
											visible: true,
											color: 0xe8a7f0,
											intensity: 4,
										}),
									duration: [20, 60],
								},
							],
						});
						break;

					case AnomalyState.Chase:
						updateLights({ visible: true, color: 0xf51827, intensity: 2 });
						break;
				}
			},
		);

		return unsubscribe;
	}, [room]);

	return null;
}
