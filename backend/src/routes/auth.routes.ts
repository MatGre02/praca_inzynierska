import { Router } from "express";
import { z } from "zod";
import { rejestracjaSchema, logowanieSchema } from "../schemas/auth";
import { Uzytkownik } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { generujJwt } from "../utils/jwt";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

/**
 * POST /api/auth/rejestracja
 */
router.post("/rejestracja", async (req, res) => {
  try {
    const body = rejestracjaSchema.extend({ kategoria: z.string().optional() }).parse(req.body);

    const istnieje = await Uzytkownik.findOne({ email: body.email });
    if (istnieje) return res.status(409).json({ message: "Uzytkownik juz istnieje" });

    const hasloHash = await hashPassword(body.haslo);

    const uzytkownik = await Uzytkownik.create({
      email: body.email,
      hasloHash,
      rola: body.rola,
      imie: body.imie,
      nazwisko: body.nazwisko,
      telefon: body.telefon,
      narodowosc: body.narodowosc,
      pozycja: body.pozycja ?? null,
      kategoria: body.kategoria ?? "BRAK"
    });

    return res.status(201).json({
      id: uzytkownik.id,
      email: uzytkownik.email,
      rola: uzytkownik.rola
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ message: "Bledne dane", errors: e.flatten() });
    }
    return res.status(500).json({ message: "Blad serwera" });
  }
});

/**
 * POST /api/auth/logowanie
 */
router.post("/logowanie", async (req, res) => {
  try {
    const body = logowanieSchema.parse(req.body);

    const uzytkownik = await Uzytkownik.findOne({ email: body.email });
    if (!uzytkownik) return res.status(401).json({ message: "Nieprawidlowe dane logowania" });

    const ok = await verifyPassword(body.haslo, uzytkownik.hasloHash);
    if (!ok) return res.status(401).json({ message: "Nieprawidlowe dane logowania" });

    const token = generujJwt({ 
      sub: uzytkownik.id, 
      rola: uzytkownik.rola, 
      kategoria: uzytkownik.kategoria || "BRAK"
    });

    return res.json({
      token,
      uzytkownik: {
        id: uzytkownik.id,
        email: uzytkownik.email,
        rola: uzytkownik.rola,
        imie: uzytkownik.imie,
        nazwisko: uzytkownik.nazwisko,
        kategoria: uzytkownik.kategoria,
        pozycja: uzytkownik.pozycja,
        telefon: uzytkownik.telefon,
        narodowosc: uzytkownik.narodowosc,
        contractStart: uzytkownik.contractStart,
        contractEnd: uzytkownik.contractEnd
      }
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ message: "Bledne dane", errors: e.flatten() });
    }
    console.error("Błąd logowania:", e);
    return res.status(500).json({ message: "Blad serwera", blad: String(e) });
  }
});

// GET /api/auth/me
router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Brak autoryzacji" });
    }

    const user = await Uzytkownik.findById(req.user.id).select("-hasloHash");
    if (!user) {
      return res.status(404).json({ message: "Nie znaleziono użytkownika" });
    }

    return res.json(user);
  } catch (error) {
    console.error("❌ Błąd przy pobieraniu danych użytkownika:", error);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

export default router;
