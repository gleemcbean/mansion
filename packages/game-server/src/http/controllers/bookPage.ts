import path from "node:path";
import { ANOMALIES } from "@mansion/shared/constants/anomalies";
import type AnomalyType from "@mansion/shared/utils/Anomaly";
import {
	type CanvasRenderingContext2D,
	createCanvas,
	loadImage,
	registerFont,
} from "canvas";

const BOOK_WIDTH = 438;
const BOOK_HEIGHT = 612;
const PAGE_PADDING = 40;
const TEXT_COLOR = "#49312a";

type PageContent = {
	syllables: string[];
	anomaly: string;
	step: number;
};

const fonts = ["MQSMagic", "BadHandwriter"];

for (const font of fonts) {
	registerFont(path.join(__dirname, `../../assets/fonts/${font}.ttf`), {
		family: font,
	});
}

function textWrap(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
) {
	const words = text.split(" ");
	const lines: string[] = [];
	let currentLine = words[0];

	for (let i = 1; i < words.length; i++) {
		const word = words[i];
		const width = ctx.measureText(`${currentLine} ${word}`).width;

		if (word!.includes("\n")) {
			const [beforeNewline, ...afterNewline] = word!.split("\n");
			currentLine += ` ${beforeNewline}`;
			lines.push(currentLine!);
			currentLine = afterNewline.join("\n").split(" ")[0];
		} else if (width < maxWidth) {
			currentLine += ` ${word}`;
		} else {
			lines.push(currentLine!);
			currentLine = word;
		}
	}

	lines.push(currentLine!);
	return lines;
}

export default async function bookPageController(req: Request) {
	const canvas = createCanvas(BOOK_WIDTH, BOOK_HEIGHT);
	const ctx = canvas.getContext("2d");

	const url = new URL(req.url);
	const rawPageContent = url.searchParams.get("d");

	try {
		if (rawPageContent) {
			const pageContent: PageContent = JSON.parse(
				atob(decodeURIComponent(rawPageContent)),
			);

			if (
				!pageContent.syllables ||
				!Array.isArray(pageContent.syllables) ||
				pageContent.syllables.length < 2 ||
				typeof pageContent.anomaly !== "string" ||
				pageContent.anomaly.length === 0 ||
				typeof pageContent.step !== "number" ||
				pageContent.step >= pageContent.syllables.length
			) {
				return new Response("Bad Request: Invalid 'd' query parameter", {
					status: 400,
				});
			}

			const Anomaly: typeof AnomalyType | null = ANOMALIES.get(
				pageContent.anomaly,
			);

			if (!Anomaly) {
				return new Response("Bad Request: Invalid anomaly type", {
					status: 400,
				});
			}

			const [background, anomalyImage] = await Promise.all([
				loadImage(path.join(__dirname, "../../assets/images/page-texture.jpg")),
				loadImage(
					path.join(
						__dirname,
						`../../assets/images/anomalies/${Anomaly.id}.png`,
					),
				),
			]);

			ctx.drawImage(background, 0, 0, BOOK_WIDTH, BOOK_HEIGHT);

			ctx.fillStyle = TEXT_COLOR;
			ctx.textAlign = "left";
			ctx.font = "70px BadHandwriter";

			ctx.fillText(
				Anomaly.name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
				PAGE_PADDING,
				PAGE_PADDING + 40,
			);

			ctx.fillStyle = `${TEXT_COLOR}dd`;
			ctx.font = "30px MQSMagic";
			const lines = textWrap(
				ctx,
				Anomaly.description,
				BOOK_WIDTH - PAGE_PADDING * 2,
			);

			let y = PAGE_PADDING + 100;
			for (const line of lines) {
				ctx.fillText(line, PAGE_PADDING, y);
				y += 30;
			}

			ctx.globalAlpha = 0.8;
			const size = canvas.height - y - PAGE_PADDING - 50;
			ctx.drawImage(anomalyImage, canvas.width / 2 - size / 2, y, size, size);
			ctx.globalAlpha = 1.0;

			ctx.font = "45px BadHandwriter";

			let space = 0;
			for (const [index, syllable] of pageContent.syllables.entries()) {
				if (index < pageContent.step) {
					ctx.fillStyle = `${TEXT_COLOR}88`;
				} else {
					ctx.fillStyle = TEXT_COLOR;
				}

				ctx.fillText(
					syllable,
					PAGE_PADDING + space,
					canvas.height - PAGE_PADDING,
				);

				space +=
					ctx.measureText(syllable).width +
					(index < pageContent.syllables.length - 1 ? 30 : 0);
			}
		} else {
			const background = await loadImage(
				path.join(__dirname, "../../assets/images/page-texture.jpg"),
			);

			ctx.drawImage(background, 0, 0, BOOK_WIDTH, BOOK_HEIGHT);
		}
	} catch (error) {
		console.error(error);

		return new Response("Bad Request: Invalid 'd' query parameter", {
			status: 400,
		});
	}

	const imageBuffer = canvas.toBuffer("image/png");

	return new Response(imageBuffer, {
		headers: { "Content-Type": "image/png" },
	});
}
