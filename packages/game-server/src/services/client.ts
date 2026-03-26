import type { UUID } from "@mansion/shared/types/util";
import type { WSData } from "@/ws/types";

export default new Map<UUID, Bun.ServerWebSocket<WSData>>();
