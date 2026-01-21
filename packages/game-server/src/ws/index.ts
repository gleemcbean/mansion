import { readdir } from "node:fs/promises";
import path from "node:path";
import { ClientPacketType } from "@mansion/shared/types/packets";
import clients from "@/services/client";
import { Logger } from "@/utils/Logger";
import type { EventCallback, MessageType, WSData } from "./types";

const events: Map<ClientPacketType, EventCallback> = new Map();

(async () => {
	const files = await readdir(path.join(import.meta.dir, "handlers"));

	files.forEach(async (file) => {
		if (!file.endsWith(".ts")) return;

		const handler = await import(path.join(import.meta.dir, "handlers", file));
		if (!handler.default) return;

		events.set(handler.default.packet, handler.default.callback);
	});
})();

export default {
	open(ws) {
		Logger.info(`Client connected: ${ws.data.uuid}`, {
			context: "WS",
		});

		clients.set(ws.data.uuid, ws);
	},
	close(ws, code) {
		Logger.info(`Client disconnected: ${ws.data.uuid} (${code})`, {
			context: "WS",
		});

		clients.delete(ws.data.uuid);
		if (ws.data.lobby) events.get(ClientPacketType.LeaveGame)?.(ws, {});
	},
	message(ws, message) {
		try {
			const parsed: MessageType = JSON.parse(message.toString());
			if (!parsed.type) return;

			Logger.info(`Received message from ${ws.data.uuid}: '${parsed.type}'`, {
				context: "WS",
			});

			events.get(parsed.type)?.(ws, parsed.data ?? {});
		} catch (e) {
			Logger.error(`Failed to parse message from ${ws.data.uuid}: ${e}`, {
				context: "WS",
			});
		}
	},
} as Bun.WebSocketHandler<WSData>;
