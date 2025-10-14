import express from "express";
import { AddressInfo } from "net";
import { createServer } from "vite";
import path from "path";
import fs from "fs";
import ejs from "ejs";
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
      renderedHTML
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
  console.log(!!req.get("Cookie"));

  const code = req.params.code;
  if (!/^[a-zA-Z0-9]{6}$/.test(code)) return res.redirect("/");
  return res.cookie("code", code.toUpperCase()).redirect("/");
});

const server = await app.listen(process.env.PORT);
const address = server.address() as AddressInfo;

console.log(`Server running on http://localhost:${address.port}`);
