import { Request, Response, NextFunction } from "express";
import { sprawdzJwt } from "../utils/jwt";
import { Uzytkownik } from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    rola: string;
    email?: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Brak tokenu autoryzacyjnego" });
    }

    // 🔧 Poprawka typowania — TS już wie, że to string
    const token: string = authHeader.split(" ")[1]!;

    const decoded = sprawdzJwt(token);

    const user = await Uzytkownik.findById(decoded.sub).select("-hasloHash");
    if (!user) {
      return res.status(401).json({ message: "Użytkownik nie istnieje" });
    }

    req.user = {
      id: user.id,
      rola: user.rola,
      email: user.email
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Nieprawidłowy lub wygasły token" });
  }
};
