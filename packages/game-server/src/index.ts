import router from "@/http/routes";
import ws from "@/ws";

const server = Bun.serve({
	port: Bun.env.PORT,
	fetch: router,
	websocket: ws,
	development: {
		console: true,
		hmr: true,
	},
});

console.log(`Server started on https://${server.port}.gche.me`);
