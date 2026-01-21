import type { ClientPacketMap } from "@mansion/shared/types/packets";
import type { EventCallback } from "@/ws/types";

export default class EventHandler<T extends keyof ClientPacketMap> {
	public packet: T;
	public callback: EventCallback<T>;

	public constructor(packet: T, callback: EventCallback<T>) {
		this.packet = packet;
		this.callback = callback;
	}
}
