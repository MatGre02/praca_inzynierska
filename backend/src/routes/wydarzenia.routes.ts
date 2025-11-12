import { Router } from "express";
import { Wydarzenie, TypWydarzenia } from "../models/Wydarzenie";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sprawdzRole } from "../middleware/rola.middleware";
import { Uzytkownik } from "../models/User";
import { wyslijMaila } from "../utils/mailer";

const router = Router();

// Utwórz wydarzenie (PREZES, TRENER)
router.post("/", authMiddleware, sprawdzRole(["PREZES", "TRENER"]), async (req: AuthRequest, res) => {
  try {
    const { tytul, opis, typ, data, lokalizacja, dataKonca, categoria } = req.body as {
      tytul: string; opis?: string; typ: TypWydarzenia; data: string; lokalizacja?: string; dataKonca?: string; categoria: string;
    };
    if (!tytul || !typ || !data || !categoria) return res.status(400).json({ message: "Brak wymaganych pół" });

    // TRENER może tworzyć tylko dla swojej kategorii
    const user = await Uzytkownik.findById(req.user!.id);
    if (user?.rola === "TRENER" && user.kategoria !== categoria) {
      return res.status(403).json({ message: "Trener może tworzyć wydarzenia tylko dla swojej kategorii" });
    }

    const doc = await Wydarzenie.create({
      tytul,
      opis,
      typ,
      data: new Date(data),
      dataKonca: dataKonca ? new Date(dataKonca) : undefined,
      lokalizacja,
      categoria,
      utworzyl: req.user!.id
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Lista wydarzeń (wszyscy zalogowani)
// Query params: ?type=TRENING&month=12&year=2024&limit=50&skip=0
// ZAWODNIK widzi tylko eventy z JEGO kategorii
// TRENER widzi wszystkie
// PREZES widzi wszystkie
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { type, month, year, limit = "50", skip = "0" } = req.query;
    const requester = await Uzytkownik.findById(req.user?.id);

    // Budowanie filtru
    const filter: any = {};

    // Filtrowanie po typie
    if (type) {
      filter.typ = type;
    }

    // Filtrowanie po miesiącu i roku
    if (month && year) {
      const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
      const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
      filter.data = { $gte: startDate, $lte: endDate };
    } else if (year) {
      const startDate = new Date(parseInt(year as string), 0, 1);
      const endDate = new Date(parseInt(year as string), 11, 31);
      filter.data = { $gte: startDate, $lte: endDate };
    }

    // ZAWODNIK widzi tylko eventy z JEGO kategorii
    // TRENER widzi tylko eventy z JEGO kategorii
    // PREZES widzi wszystkie
    if (requester?.rola === "ZAWODNIK") {
      filter.categoria = requester.kategoria;
    } else if (requester?.rola === "TRENER") {
      filter.categoria = requester.kategoria;
    }
    // PREZES widzi wszystkie (brak filtrowania)

    // Paginacja
    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const skipNum = parseInt(skip as string) || 0;

    // Pobieranie danych
    const wydarzenia = await Wydarzenie.find(filter)
      .populate("utworzyl", "imie nazwisko rola")
      .sort({ data: 1 })
      .limit(limitNum)
      .skip(skipNum);

    // Liczba całkowita
    const total = await Wydarzenie.countDocuments(filter);

    // Dla ZAWODNIKA – usuń listę uczestników
    if (requester?.rola === "ZAWODNIK") {
      const filtered = wydarzenia.map((w) => {
        const obj = w.toObject();
        delete (obj as any).uczestnicy;
        return obj;
      });
      return res.json({
        total,
        limit: limitNum,
        skip: skipNum,
        data: filtered
      });
    }

    res.json({
      total,
      limit: limitNum,
      skip: skipNum,
      data: wydarzenia
    });
  } catch (e) {
    console.error("Błąd pobierania wydarzeń:", e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Szczegóły wydarzenia
// - PREZES/TRENER: z pełną listą uczestników
// - ZAWODNIK: widzi listę, ale niesort (tylko swój status)
router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const doc = await Wydarzenie.findById(req.params.id).populate("uczestnicy.zawodnik", "imie nazwisko email");
    if (!doc) return res.status(404).json({ message: "Nie znaleziono" });

    res.json(doc);
  } catch (e) {
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Zawodnik: potwierdza/odrzuca udział (tylko TRENING)
router.post("/:id/udzial", authMiddleware, sprawdzRole(["ZAWODNIK"]), async (req: AuthRequest, res) => {
  try {
    const { wezmieUdzial } = req.body as { wezmieUdzial: boolean };
    const wydarzenie = await Wydarzenie.findById(req.params.id);

    if (!wydarzenie) {
      return res.status(404).json({ message: "Nie znaleziono wydarzenia" });
    }

    if (wydarzenie.typ !== "TRENING") {
      return res.status(400).json({ message: "Udział można oznaczać tylko dla TRENINGU" });
    }

    // Upewniamy się, że tablica uczestników istnieje
    if (!Array.isArray(wydarzenie.uczestnicy)) {
      wydarzenie.uczestnicy = [];
    }

    // Upewniamy się, że użytkownik istnieje
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Brak danych użytkownika (błąd autoryzacji)" });
    }

    // Szukamy, czy zawodnik już istnieje w tablicy uczestników
    const idx = wydarzenie.uczestnicy.findIndex(
      (u) => String(u.zawodnik) === String(userId)
    );

    if (idx === -1) {
      // jeśli zawodnik jeszcze nie był zapisany
      wydarzenie.uczestnicy.push({
        zawodnik: new (require("mongoose").Types.ObjectId)(userId),
        status: wezmieUdzial ? "TAK" : "NIE",
      });
    } else {
      // jeśli już istnieje — aktualizujemy jego status
      const uczestnik = wydarzenie.uczestnicy[idx];
      if (uczestnik) {
        uczestnik.status = wezmieUdzial ? "TAK" : "NIE";
      }
    }

    await wydarzenie.save();
    
    // Populate po zapisaniu
    const populatedEvent = await Wydarzenie.findById(req.params.id).populate("uczestnicy.zawodnik", "imie nazwisko email");
    
    return res.json({
      message: "Zapisano udział",
      status: wezmieUdzial ? "TAK" : "NIE",
      data: populatedEvent
    });
  } catch (e) {
    console.error("Błąd przy zapisie udziału:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

// Prezes/Trener: podgląd uczestników treningu
router.get("/:id/uczestnicy", authMiddleware, sprawdzRole(["PREZES", "TRENER"]), async (req, res) => {
  try {
    const doc = await Wydarzenie.findById(req.params.id).populate("uczestnicy.zawodnik", "imie nazwisko email");
    if (!doc) return res.status(404).json({ message: "Nie znaleziono" });
    res.json(doc.uczestnicy);
  } catch (e) {
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * PATCH /api/wydarzenia/:id
 * Edytuje wydarzenie (tylko twórca lub PREZES)
 */
router.patch("/:id", authMiddleware, sprawdzRole(["PREZES", "TRENER"]), async (req: AuthRequest, res) => {
  try {
    const { tytul, opis, typ, data, lokalizacja, dataKonca, categoria } = req.body;

    const wydarzenie = await Wydarzenie.findById(req.params.id);
    if (!wydarzenie) {
      return res.status(404).json({ message: "Nie znaleziono wydarzenia" });
    }

    // Tylko twórca lub PREZES mogą edytować
    if (
      req.user?.rola !== "PREZES" &&
      String(wydarzenie.utworzyl) !== String(req.user?.id)
    ) {
      return res.status(403).json({
        message: "Nie masz uprawnień do edycji tego wydarzenia"
      });
    }

    // Aktualizuj pola
    if (tytul) wydarzenie.tytul = tytul;
    if (opis) wydarzenie.opis = opis;
    if (typ) wydarzenie.typ = typ;
    if (data) wydarzenie.data = new Date(data);
    if (lokalizacja) wydarzenie.lokalizacja = lokalizacja;
    if (dataKonca) wydarzenie.dataKonca = new Date(dataKonca);
    if (categoria) {
      if (req.user?.rola === "TRENER" && categoria !== wydarzenie.categoria) {
        return res.status(403).json({ message: "Trener nie może zmienić kategorii wydarzenia" });
      }
      wydarzenie.categoria = categoria;
    }

    // Zresetuj reminderSent bo event się zmienił
    wydarzenie.reminderSent = false;

    await wydarzenie.save();

    res.json({
      message: "Wydarzenie zaktualizowane",
      data: wydarzenie
    });
  } catch (e) {
    console.error("Błąd edycji wydarzenia:", e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * DELETE /api/wydarzenia/:id
 * Usuwa wydarzenie (tylko twórca lub PREZES)
 */
router.delete("/:id", authMiddleware, sprawdzRole(["PREZES", "TRENER"]), async (req: AuthRequest, res) => {
  try {
    const wydarzenie = await Wydarzenie.findById(req.params.id);
    if (!wydarzenie) {
      return res.status(404).json({ message: "Nie znaleziono wydarzenia" });
    }

    // Tylko twórca lub PREZES mogą usuwać
    if (
      req.user?.rola !== "PREZES" &&
      String(wydarzenie.utworzyl) !== String(req.user?.id)
    ) {
      return res.status(403).json({
        message: "Nie masz uprawnień do usunięcia tego wydarzenia"
      });
    }

    await Wydarzenie.findByIdAndDelete(req.params.id);

    res.json({ message: "Wydarzenie usunięte" });
  } catch (e) {
    console.error("Błąd usuwania wydarzenia:", e);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

router.post("/test-mail", async (req, res) => {
  try {
    const to = req.body.to || process.env.SMTP_USER;
    await wyslijMaila(
      to,
      "Test maila z aplikacji",
      "<b>Wiadomość testowa z kalendarza wydarzeń.</b>"
    );
    res.json({ message: "✅ Mail wysłany poprawnie do " + to });
  } catch (err) {
    console.error("❌ Błąd wysyłki maila:", err);
    res.status(500).json({ message: "Błąd wysyłki maila", error: String(err) });
  }
});

export default router;
