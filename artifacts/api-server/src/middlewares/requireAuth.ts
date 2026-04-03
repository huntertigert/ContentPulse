import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";

const ALLOWED_DOMAINS = ["alkami.com", "alkamitech.com"];

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    const userId = auth?.sessionClaims?.userId || auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let email = (auth?.sessionClaims as any)?.email as string | undefined;

    if (!email) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId as string);
        email = user.emailAddresses?.find(
          (e) => e.id === user.primaryEmailAddressId,
        )?.emailAddress;
      } catch {
        return res.status(403).json({ error: "Unable to verify email domain" });
      }
    }

    if (!email) {
      return res.status(403).json({ error: "No email address associated with account" });
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain || !ALLOWED_DOMAINS.includes(domain)) {
      return res.status(403).json({ error: "Access restricted to Alkami users only" });
    }

    (req as any).userId = userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
