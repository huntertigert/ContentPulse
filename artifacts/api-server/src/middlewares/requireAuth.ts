import { type Request, type Response, type NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";

const ALLOWED_DOMAINS = ["alkami.com", "alkamitech.com"];

function extractEmail(auth: any): string | undefined {
  const claims = auth?.sessionClaims;
  if (!claims) return undefined;
  if (claims.email) return claims.email;
  if (claims.email_address) return claims.email_address;
  if (claims.primary_email) return claims.primary_email;
  if (claims.sub_email) return claims.sub_email;
  return undefined;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);
    const userId = auth?.sessionClaims?.userId || auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let email = extractEmail(auth);

    if (!email) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId as string);
        email = user.emailAddresses?.find(
          (e: any) => e.id === user.primaryEmailAddressId,
        )?.emailAddress;
      } catch (clerkErr) {
        console.error("Clerk user lookup failed:", clerkErr);
      }
    }

    if (!email) {
      console.warn(`No email found for user ${userId}, allowing access (domain check skipped)`);
      (req as any).userId = userId;
      return next();
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
