import type { ClientPacketMap } from "@mansion/shared/types/packets";
import type { Client } from "@mansion/shared/types/player";
import type { UUID } from "@mansion/shared/types/util";

export type MessageType<
	T extends keyof ClientPacketMap = keyof ClientPacketMap,
> = {
	type: T;
	data?: ClientPacketMap[T];
};

export type EventCallback<
	T extends keyof ClientPacketMap = keyof ClientPacketMap,
> = (ws: Bun.ServerWebSocket<WSData>, data: ClientPacketMap[T]) => void;

export type WSData = {
	uuid: UUID;
	username: string;
	lobby?: string;
};

export type WSClient = Client & { ws: Bun.ServerWebSocket<WSData> };
