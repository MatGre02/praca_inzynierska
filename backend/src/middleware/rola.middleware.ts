import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

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

export const sprawdzRole = (dozwolone: Array<"PREZES" | "TRENER" | "ZAWODNIK">) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    const rola = req.user?.rola as "PREZES" | "TRENER" | "ZAWODNIK" | undefined;
    if (!rola || !dozwolone.includes(rola)) {
      return res.status(403).json({ message: "Dostęp zabroniony" });
    }
    next();
  };