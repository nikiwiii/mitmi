import { isPostgresActive } from "../db.js";

export function getHealthStatus() {
  return {
    status: "ok",
    database: isPostgresActive() ? "postgresql" : "memory-fallback",
  };
}
