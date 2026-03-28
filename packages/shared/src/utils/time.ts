export async function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function waitRandom(minMs: number, maxMs: number) {
	return wait(Math.random() * (maxMs - minMs + 1) + minMs);
}
