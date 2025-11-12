import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { tylkoPrezes } from "../middleware/rola.middleware";
import { Uzytkownik } from "../models/User";
import { hashPassword } from "../utils/password";

const router = Router();

/**
 * GET /api/admin/uzytkownicy — lista wszystkich użytkowników
 * PREZES widzi wszystkich, TRENER widzi zawodników ze SWOJEJ kategorii
 * Query params: ?role=ZAWODNIK&category=U9&position=BR&limit=10&skip=0
 */
router.get("/uzytkownicy", authMiddleware, async (req: any, res) => {
  try {
    if (!req.user?.rola) {
      return res.status(403).json({ message: "Dostęp zabroniony" });
    }

    const { role, category, position, limit = "100", skip = "0" } = req.query;

    let filter: any = {};

    if (req.user?.rola === "PREZES") {
      if (role) filter.rola = role;
      if (category) filter.kategoria = category;
      if (position) filter.pozycja = position;
    } else if (req.user?.rola === "ZAWODNIK") {
      filter.rola = { $in: ["TRENER", "PREZES"] };
    } else if (req.user?.rola === "TRENER") {
      filter.rola = "ZAWODNIK";
      filter.kategoria = req.user?.kategoria;
    }

    const limitNum = Math.min(parseInt(limit as string) || 100, 100);
    const skipNum = parseInt(skip as string) || 0;

    const users = await Uzytkownik.find(filter)
      .select("-hasloHash -resetTokenHash -resetTokenExp")
      .limit(limitNum)
      .skip(skipNum)
      .sort({ createdAt: -1 });

    const total = await Uzytkownik.countDocuments(filter);

    res.json({
      total,
      limit: limitNum,
      skip: skipNum,
      data: users
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * POST /api/admin/uzytkownicy — tworzenie nowego użytkownika
 */
router.post("/uzytkownicy", authMiddleware, tylkoPrezes, async (req, res) => {
  try {
    const { email, rola, imie, nazwisko, kategoria, telefon, narodowosc, pozycja, contractStart, contractEnd } = req.body;

    const istnieje = await Uzytkownik.findOne({ email });
    if (istnieje) return res.status(409).json({ message: "Użytkownik już istnieje" });

    const losoweHaslo = Math.random().toString(36).slice(-8);
    const hasloHash = await hashPassword(losoweHaslo);

    const nowy = await Uzytkownik.create({
      email,
      hasloHash,
      rola,
      imie,
      nazwisko,
      kategoria: kategoria ?? "BRAK",
      telefon: telefon || null,
      narodowosc: narodowosc || null,
      pozycja: pozycja || null,
      contractStart: contractStart ? new Date(contractStart) : null,
      contractEnd: contractEnd ? new Date(contractEnd) : null,
    });

    res.status(201).json({
      id: nowy.id,
      email: nowy.email,
      rola: nowy.rola,
      message: `✅ Użytkownik ${imie} ${nazwisko} został utworzony. Tymczasowe hasło: ${losoweHaslo}`
    });
  } catch (e) {
    console.error("Błąd tworzenia użytkownika:", e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * GET /api/admin/uzytkownicy/:id — szczegóły użytkownika
 * Projekcja: jeśli pobierający to TRENER i zawodnik z innej kategorii → brak contractStart/End
 */
router.get("/uzytkownicy/:id", authMiddleware, async (req: any, res) => {
  try {
    const requestor = await Uzytkownik.findById(req.user?.id).select(
      "-hasloHash -resetTokenHash -resetTokenExp"
    );
    const target = await Uzytkownik.findById(req.params.id).select(
      "-hasloHash -resetTokenHash -resetTokenExp"
    );

    if (!target) return res.status(404).json({ message: "Nie znaleziono użytkownika" });

    if (requestor?.rola === "PREZES") {
      return res.json(target);
    }

    if (requestor?.rola === "ZAWODNIK") {
      if (String(requestor._id) !== String(req.params.id)) {
        return res.status(403).json({ message: "Dostęp zabroniony" });
      }
      return res.json(target);
    }

    if (requestor?.rola === "TRENER") {
      if (target.rola === "ZAWODNIK" && target.kategoria !== requestor.kategoria) {
        return res.status(403).json({
          message: "Nie masz dostępu do zawodników z innej kategorii"
        });
      }

      const targetObj = target.toObject();
      delete (targetObj as any).contractStart;
      delete (targetObj as any).contractEnd;
      return res.json(targetObj);
    }

    return res.status(403).json({ message: "Dostęp zabroniony" });
  } catch (e) {
    console.error(e);
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

/**
 * PATCH /api/admin/uzytkownicy/:id/role
 * Zmienia rolę użytkownika (PREZES only)
 */
router.patch("/uzytkownicy/:id/role", authMiddleware, tylkoPrezes, async (req, res) => {
  try {
    const { rola } = req.body;

    if (!["PREZES", "TRENER", "ZAWODNIK"].includes(rola)) {
      return res.status(400).json({ message: "Nieprawidłowa rola" });
    }

    const updated = await Uzytkownik.findByIdAndUpdate(
      req.params.id,
      { rola },
      { new: true }
    ).select("-hasloHash");

    if (!updated) return res.status(404).json({ message: "Nie znaleziono użytkownika" });

    res.json({
      message: "Rola zmieniona",
      user: updated
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * PATCH /api/admin/uzytkownicy/:id/position
 * Zmienia pozycję zawodnika (PREZES only)
 */
router.patch("/uzytkownicy/:id/position", authMiddleware, tylkoPrezes, async (req, res) => {
  try {
    const { pozycja } = req.body;

    if (!["BRAMKARZ", "OBRONCA", "POMOCNIK", "NAPASTNIK", null].includes(pozycja)) {
      return res.status(400).json({ message: "Nieprawidłowa pozycja" });
    }

    const updated = await Uzytkownik.findByIdAndUpdate(
      req.params.id,
      { pozycja },
      { new: true }
    ).select("-hasloHash");

    if (!updated) return res.status(404).json({ message: "Nie znaleziono użytkownika" });

    res.json({
      message: "Pozycja zmieniona",
      user: updated
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * PATCH /api/admin/uzytkownicy/:id/category
 * Zmienia kategorię użytkownika (PREZES only)
 */
router.patch("/uzytkownicy/:id/category", authMiddleware, tylkoPrezes, async (req, res) => {
  try {
    const { kategoria } = req.body;

    if (!["U9", "U11", "U13", "U15", "U17", "U19", "SENIOR", "BRAK"].includes(kategoria)) {
      return res.status(400).json({ message: "Nieprawidłowa kategoria" });
    }

    const updated = await Uzytkownik.findByIdAndUpdate(
      req.params.id,
      { kategoria },
      { new: true }
    ).select("-hasloHash");

    if (!updated) return res.status(404).json({ message: "Nie znaleziono użytkownika" });

    res.json({
      message: "Kategoria zmieniona",
      user: updated
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * PATCH /api/admin/uzytkownicy/:id/password
 * Zmienia hasło użytkownika (PREZES only)
 */
router.patch("/uzytkownicy/:id/password", authMiddleware, tylkoPrezes, async (req, res) => {
  try {
    const { haslo } = req.body;

    if (!haslo || haslo.length < 6) {
      return res.status(400).json({ message: "Hasło musi mieć co najmniej 6 znaków" });
    }

    const hasloHash = await hashPassword(haslo);

    const updated = await Uzytkownik.findByIdAndUpdate(
      req.params.id,
      { hasloHash },
      { new: true }
    ).select("-hasloHash");

    if (!updated) return res.status(404).json({ message: "Nie znaleziono użytkownika" });

    res.json({
      message: "Hasło zmienione pomyślnie",
      user: updated
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

export default router;
