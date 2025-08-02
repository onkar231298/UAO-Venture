import type { Express } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";

export function registerLocationRoutes(app: Express) {
  // Update user location and currency preferences
  app.post('/api/user/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { country, currency, timezone, latitude, longitude } = req.body;

      // Update user's location data
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        ...currentUser,
        country,
        currency,
        timezone,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        updatedAt: new Date(),
      });

      res.json({ 
        message: "Location updated successfully", 
        user: updatedUser 
      });
    } catch (error) {
      console.error("Error updating user location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Get user's saved location preferences
  app.get('/api/user/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        country: user.country,
        currency: user.currency,
        timezone: user.timezone,
        latitude: user.latitude,
        longitude: user.longitude,
      });
    } catch (error) {
      console.error("Error fetching user location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });
}