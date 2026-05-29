import { appendFile, mkdir } from "fs/promises";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "server.log");

// Logs server failures with enough context to debug, written both to stderr
// and logs/server.log. Never log passwords, tokens, or full PII payloads.
export async function logError(context: string, error: unknown, extra?: Record<string, unknown>) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const entry = {
    time: new Date().toISOString(),
    level: "error",
    context,
    message,
    ...extra,
    stack,
  };

  // eslint-disable-next-line no-console
  console.error(`[${entry.time}] ${context}: ${message}`, extra ?? "");

  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch {
    // If we can't write the log file, the console line above still fired.
  }
}
