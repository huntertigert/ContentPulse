import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    const userId = auth?.sessionClaims?.userId || auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    (req as any).userId = userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
