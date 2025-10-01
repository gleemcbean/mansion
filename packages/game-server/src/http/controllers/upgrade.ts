import Generators from "@/utils/Generators";
import { Logger } from "@/utils/Logger";
import type { WSData } from "@/ws/types";
import type { UUID } from "@mansion/shared/types/util";

export default async function upgradeController(
  req: Request,
  server: Bun.Server
): Promise<Response> {
  Logger.info("WebSocket upgrade requested", { context: "HTTP" });

  const client: WSData = {
    uuid: Bun.randomUUIDv7() as UUID,
    username: Generators.generateGuestName(),
  };

  if (server.upgrade(req, { data: client })) {
    return Response.json("Upgraded", { status: 101 });
  }

  return new Response("Upgrade failed", { status: 400 });
}
