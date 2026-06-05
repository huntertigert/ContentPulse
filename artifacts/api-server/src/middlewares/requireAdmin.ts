import { type Request, type Response, type NextFunction } from "express";

const DEFAULT_ADMIN_EMAILS = "hunter.tigert@alkami.com";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Restricts a route to workspace admins. Must run AFTER requireAuth, which sets
 * `req.userEmail`. Used to ensure only the designated admin can run actions that
 * mutate the shared dataset everyone sees (monthly refresh / CSV uploads / fix
 * titles).
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const email = ((req as any).userEmail as string | undefined)?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    return res
      .status(403)
      .json({ error: "Only the workspace admin can perform this action." });
  }
  return next();
}
