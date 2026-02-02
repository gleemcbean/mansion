import bookPageController from "./controllers/bookPage";
import healthController from "./controllers/health";
import upgradeController from "./controllers/upgrade";

export default async function router(
	req: Request,
	server: Bun.Server,
): Promise<Response> {
	try {
		const url = new URL(req.url);

		if (url.pathname === "/health") return healthController();
		if (url.pathname === "/ws") return upgradeController(req, server);
		if (url.pathname === "/book-page") return bookPageController(req);

		return new Response("Not Found", { status: 404 });
	} catch {
		return new Response("Internal Server Error", { status: 500 });
	}
}
