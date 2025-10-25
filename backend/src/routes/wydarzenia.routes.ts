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
    const { tytul, opis, typ, data } = req.body as {
      tytul: string; opis?: string; typ: TypWydarzenia; data: string;
    };
    if (!tytul || !typ || !data) return res.status(400).json({ message: "Brak wymaganych pól" });

    const doc = await Wydarzenie.create({
      tytul,
      opis,
      typ,
      data: new Date(data),
      utworzyl: req.user!.id
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Lista wydarzeń (wszyscy zalogowani)
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const wydarzenia = await Wydarzenie.find().sort({ data: 1 });
    res.json(wydarzenia);
  } catch (e) {
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Szczegóły wydarzenia
// - PREZES/TRENER: z listą uczestników
// - ZAWODNIK: bez listy uczestników (tylko meta)
router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const doc = await Wydarzenie.findById(req.params.id).populate("uczestnicy.zawodnik", "imie nazwisko email");
    if (!doc) return res.status(404).json({ message: "Nie znaleziono" });

    if (req.user?.rola === "ZAWODNIK") {
      const { uczestnicy, ...plain } = doc.toObject() as any;
      delete plain.uczestnicy;
      return res.json(plain);
    }
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
    return res.json({
      message: "Zapisano udział",
      status: wezmieUdzial ? "TAK" : "NIE",
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
