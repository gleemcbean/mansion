import bookPageController from "./controllers/bookPage";
import healthController from "./controllers/health";
import upgradeController from "./controllers/upgrade";

export default async function router(
	req: Request,
	server: Bun.Server,
): Promise<Response> {
	try {
		const url = new URL(req.url);

		let response: Response | null = null;
		if (url.pathname === "/health") response = await healthController();
		if (url.pathname === "/ws") response = await upgradeController(req, server);
		if (url.pathname === "/book-page") response = await bookPageController(req);

		if (response) {
			response.headers.set("Access-Control-Allow-Origin", "*");

			response.headers.set(
				"Access-Control-Allow-Methods",
				"GET, POST, PUT, PATCH, DELETE",
			);

			response.headers.set("Access-Control-Allow-Headers", "*");
			return response;
		}

		return new Response("Not Found", { status: 404 });
	} catch {
		return new Response("Internal Server Error", { status: 500 });
	}
}
