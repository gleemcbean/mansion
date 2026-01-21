import { Logger } from "@/utils/Logger";

export default async function healthController(): Promise<Response> {
	Logger.info("Health check requested", { context: "HTTP" });

	return Response.json({
		status: "ok",
		uptime: process.uptime(),
		timestamp: Date.now(),
	});
}
