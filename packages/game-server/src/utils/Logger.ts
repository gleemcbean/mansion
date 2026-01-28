import util from "node:util";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogOptions {
	context?: string;
	meta?: Record<string, unknown>;
}

export class Logger {
	private static format(level: LogLevel, message: string, opts?: LogOptions) {
		const base = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context: opts?.context,
			...opts?.meta,
		};

		if (process.env.NODE_ENV === "production") {
			return JSON.stringify(base);
		}

		const color = {
			debug: "\x1b[36m",
			info: "\x1b[32m",
			warn: "\x1b[33m",
			error: "\x1b[31m",
		}[level];

		const reset = "\x1b[0m";
		const ctx = opts?.context ? `[${opts.context}] ` : "";

		let meta = "";
		if (opts?.meta && Object.keys(opts.meta).length > 0) {
			meta = util.inspect(opts.meta, { colors: true, depth: null });
		}

		return `${color}${level.toUpperCase()}${reset} ${ctx}${message}${
			meta ? ` ${meta}` : ""
		}`;
	}

	static debug(message: string, opts?: LogOptions) {
		console.debug(Logger.format("debug", message, opts));
	}

	static info(message: string, opts?: LogOptions) {
		console.info(Logger.format("info", message, opts));
	}

	static warn(message: string, opts?: LogOptions) {
		console.warn(Logger.format("warn", message, opts));
	}

	static error(message: string, opts?: LogOptions, err?: unknown) {
		console.error(Logger.format("error", message, opts));
		if (err) console.error(err);
	}
}
