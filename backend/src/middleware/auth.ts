import { Request, Response, NextFunction } from "express";
import { sprawdzJwt, DaneTokena } from "../utils/jwt";

export interface ZadanieAutoryzacji extends Request {
  uzytkownik?: DaneTokena;
}

export const auth = (req: ZadanieAutoryzacji, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Brak tokenu" });

  try {
    const dane = sprawdzJwt(token);
    req.uzytkownik = dane;
    next();
  } catch {
    return res.status(401).json({ message: "Nieprawidlowy token" });
  }
};
