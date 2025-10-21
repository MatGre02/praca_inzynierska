import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

// Middleware sprawdzający rolę użytkownika
export const tylkoPrezes = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rola !== "PREZES") {
    return res.status(403).json({ message: "Dostęp zabroniony – tylko dla Prezesa" });
  }
  next();
};

export const tylkoTrener = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rola !== "TRENER") {
    return res.status(403).json({ message: "Dostęp zabroniony – tylko dla Trenera" });
  }
  next();
};

export const tylkoZawodnik = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rola !== "ZAWODNIK") {
    return res.status(403).json({ message: "Dostęp zabroniony – tylko dla Zawodnika" });
  }
  next();
};
