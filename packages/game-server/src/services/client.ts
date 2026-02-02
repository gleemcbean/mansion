import type { WSData } from "@/ws/types";
import type { UUID } from "@mansion/shared/types/util";

export default new Map<UUID, Bun.ServerWebSocket<WSData>>();
