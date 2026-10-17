import type { RequestHandler } from "express";
import {
  portalAppearancePreferenceSchema,
  type PortalAppearancePreference,
} from "@shared/schema";
import { z } from "zod";

interface AppearanceUser {
  id: string;
  userType: string | null;
  portalAppearance: unknown;
}

export interface PortalAppearanceRepository {
  getUserById(userId: string): Promise<AppearanceUser | undefined>;
  savePreference(
    userId: string,
    preference: PortalAppearancePreference,
    onlyIfMissing: boolean,
  ): Promise<unknown | undefined>;
}

function getSessionUserId(user: unknown): string | null {
  if (!user || typeof user !== "object") return null;
  const claims = (user as { claims?: unknown }).claims;
  if (!claims || typeof claims !== "object") return null;
  const sub = (claims as { sub?: unknown }).sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

function parseStoredPreference(value: unknown): PortalAppearancePreference | null {
  const parsed = portalAppearancePreferenceSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function createPortalAppearanceHandlers(
  repository: PortalAppearanceRepository,
): { get: RequestHandler; put: RequestHandler } {
  const get: RequestHandler = async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const userId = getSessionUserId(req.user);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
      const user = await repository.getUserById(userId);
      if (!user || user.userType !== "staff") {
        return res.status(403).json({ message: "Staff account required" });
      }
      return res.json({ preference: parseStoredPreference(user.portalAppearance) });
    } catch (error) {
      console.error("[PortalAppearance] Could not load preference:", error);
      return res.status(500).json({ message: "Could not load appearance preference" });
    }
  };

  const put: RequestHandler = async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    const userId = getSessionUserId(req.user);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const parsed = portalAppearancePreferenceSchema
      .extend({ onlyIfMissing: z.boolean().optional() })
      .strict()
      .safeParse(payload);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid appearance preference" });
    }

    try {
      const user = await repository.getUserById(userId);
      if (!user || user.userType !== "staff") {
        return res.status(403).json({ message: "Staff account required" });
      }
      const stored = await repository.savePreference(
        userId,
        { mode: parsed.data.mode, palette: parsed.data.palette },
        parsed.data.onlyIfMissing === true,
      );
      if (stored === undefined) {
        return res.status(404).json({ message: "Staff account not found" });
      }
      return res.json({ preference: parseStoredPreference(stored) });
    } catch (error) {
      console.error("[PortalAppearance] Could not save preference:", error);
      return res.status(500).json({ message: "Could not save appearance preference" });
    }
  };

  return { get, put };
}
