import fs from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import ejs from "ejs";
import express from "express";
import { createServer } from "vite";
import config from "./config.json";

const app = express();

const vite = await createServer({
	server: { middlewareMode: true },
	appType: "custom",
});

app.use(vite.middlewares);

app.get("/", async (req, res, next) => {
	try {
		const templatePath = path.resolve(__dirname, "index.ejs");
		const template = fs.readFileSync(templatePath, "utf8");
		const renderedHTML = ejs.render(template, config);
		const htmlWithVite = await vite.transformIndexHtml(
			req.originalUrl,
			renderedHTML,
		);

		return res
			.status(200)
			.set({ "Content-Type": "text/html" })
			.send(htmlWithVite);
	} catch (err) {
		vite?.ssrFixStacktrace?.(err as Error);
		return next(err as Error);
	}
});

app.get("/:code", async (req, res) => {
	const code = req.params.code.toUpperCase();
	if (!/^[A-Z0-9]{6}$/.test(code)) return res.redirect("/");

	const isBot =
		/bot|crawl|spider|facebookexternalhit|twitterbot|discordbot/i.test(
			req.get("User-Agent") || "",
		);

	if (isBot) {
		const templatePath = path.resolve(__dirname, "index.ejs");
		return res.render(templatePath, {
			...config,
			title: `${config.title} - Join room ${code}`,
		});
	}

	return res.cookie("code", code).redirect("/");
});

const PORT = process.env.PORT || 3000;

const server = await app.listen(PORT);
const address = server.address() as AddressInfo;

console.log(`Server running on http://localhost:${address.port}`);
