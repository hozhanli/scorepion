import type { RequestHandler } from "express";

/**
 * Structured request/response logger middleware.
 * Logs method, path, status code, duration, IP, and user agent.
 * No PII or request bodies logged.
 */
export const requestLog: RequestHandler = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const entry = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    // Log errors at error level, 4xx at warn, 2xx/3xx at info
    if (res.statusCode >= 500) {
      console.error(JSON.stringify(entry));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify(entry));
    } else {
      console.info(JSON.stringify(entry));
    }
  });

  next();
};
