/**
 * Minimal structured logger. Every payload is passed through redactObject so
 * PII/secrets never reach logs. Do not log uploaded file content or full
 * provider payloads containing personal information.
 */
import { redactObject } from "@/lib/domain/redaction";

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function currentThreshold(): number {
  const lvl = (process.env.LOG_LEVEL as Level) ?? "info";
  return LEVELS[lvl] ?? LEVELS.info;
}

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < currentThreshold()) return;
  const line = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...(meta ? { meta: redactObject(meta) } : {}),
  };
  const text = JSON.stringify(line);
  if (level === "error") console.error(text);
  else if (level === "warn") console.warn(text);
  else console.log(text);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
};
