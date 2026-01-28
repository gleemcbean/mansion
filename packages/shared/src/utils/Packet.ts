import type { PacketMap } from "@/types/packets";

export default class Packet {
	public static create<T extends keyof PacketMap>(
		type: T,
		data: PacketMap[T] = {} as PacketMap[T],
	): string {
		return JSON.stringify({ type, data });
	}
}
