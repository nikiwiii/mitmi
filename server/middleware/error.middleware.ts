import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status =
    typeof err?.status === "number" && err.status >= 400 && err.status < 600
      ? err.status
      : 500;

  if (status >= 500) {
    console.error(
      `[ERROR] 500 ${req.method} ${req.originalUrl || req.url}:`,
      err
    );
  } else {
    console.warn(
      `[WARN] ${status} ${req.method} ${req.originalUrl || req.url}:`,
      err?.message || err
    );
  }

  if (res.headersSent) {
    return;
  }

  const message =
    err?.error ||
    err?.clientMessage ||
    (status >= 500 ? "blad serwera" : err?.message || "blad zapytania");

  res.status(status).json({ error: message });
}
