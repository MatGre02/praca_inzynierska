import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { tylkoPrezes } from "../middleware/rola.middleware";
import { Uzytkownik } from "../models/User";
import { hashPassword } from "../utils/password";

const router = Router();

/**
 * GET /api/admin/uzytkownicy — lista wszystkich użytkowników
 */
router.get("/uzytkownicy", authMiddleware, tylkoPrezes, async (req, res) => {
  const users = await Uzytkownik.find().select("-hasloHash");
  res.json(users);
});

/**
 * POST /api/admin/uzytkownicy — tworzenie nowego użytkownika
 */
router.post("/uzytkownicy", authMiddleware, tylkoPrezes, async (req, res) => {
  try {
    const { email, haslo, rola, imie, nazwisko, kategoria } = req.body;

    const istnieje = await Uzytkownik.findOne({ email });
    if (istnieje) return res.status(409).json({ message: "Użytkownik już istnieje" });

    const hasloHash = await hashPassword(haslo);

    const nowy = await Uzytkownik.create({
      email,
      hasloHash,
      rola,
      imie,
      nazwisko,
      kategoria: kategoria ?? "BRAK"
    });

    res.status(201).json({
      id: nowy.id,
      email: nowy.email,
      rola: nowy.rola
    });
  } catch (e) {
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * DELETE /api/admin/uzytkownicy/:id — usuwanie użytkownika
 */
router.delete("/uzytkownicy/:id", authMiddleware, tylkoPrezes, async (req, res) => {
  const { id } = req.params;
  await Uzytkownik.findByIdAndDelete(id);
  res.json({ message: "Użytkownik usunięty" });
});

/**
 * PUT /api/admin/uzytkownicy/:id — edycja danych użytkownika
 */
router.put("/uzytkownicy/:id", authMiddleware, tylkoPrezes, async (req, res) => {
  try {
    const { rola, imie, nazwisko, telefon, narodowosc, pozycja, kategoria } = req.body;

    const updated = await Uzytkownik.findByIdAndUpdate(
      req.params.id,
      { rola, imie, nazwisko, telefon, narodowosc, pozycja, kategoria },
      { new: true }
    ).select("-hasloHash");

    if (!updated) return res.status(404).json({ message: "Nie znaleziono użytkownika" });

    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});


export default router;
