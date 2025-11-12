import { Router } from "express";
import { Statystyka } from "../models/Statystyka";
import { Uzytkownik } from "../models/User";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sprawdzRole } from "../middleware/rola.middleware";

const router = Router();

/**
 * GET /api/statystyki/filters/available
 * Zwraca dostępne opcje do filtrowania statystyk
 */
router.get("/filters/available", authMiddleware, async (req: AuthRequest, res) => {
  try {
    let zawodnicy: any[] = [];

    if (req.user?.rola === "TRENER") {
      zawodnicy = await Uzytkownik.find({
        rola: "ZAWODNIK",
        kategoria: req.user?.kategoria
      }).select("kategoria pozycja");
    } else if (req.user?.rola === "PREZES") {
      zawodnicy = await Uzytkownik.find({
        rola: "ZAWODNIK"
      }).select("kategoria pozycja");
    }


    const kategorie = [...new Set(zawodnicy.map(z => z.kategoria).filter(Boolean))].sort();
    const pozycje = [...new Set(zawodnicy.map(z => z.pozycja).filter(Boolean))].sort();

    const statystyki = await Statystyka.find().select("sezon");
    const sezony = [...new Set(statystyki.map(s => s.sezon).filter(Boolean))].sort().reverse();

    return res.json({
      kategorie,
      pozycje,
      sezony
    });
  } catch (e) {
    console.error("Błąd pobierania filtrów:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * POST /api/statystyki/:zawodnikId
 * Dodaj / zaktualizuj statystyki zawodnika (PREZES, TRENER)
 * Jeżeli podasz "sezon" w body – trzymamy jedną kartę na sezon (upsert).
 * TRENER może edytować tylko zawodników z JEGO kategorii
 */
router.post("/:zawodnikId",
  authMiddleware,
  sprawdzRole(["PREZES", "TRENER"]),
  async (req: AuthRequest, res) => {
    try {
      const { zawodnikId } = req.params;
      const {
        sezon,
        zolteKartki,
        czerwoneKartki,
        rozegraneMinuty,
        strzeloneBramki,
        odbytychTreningow,
        czysteKonta
      } = req.body ?? {};

      const requester = await Uzytkownik.findById(req.user?.id);
      
      if (requester?.rola === "TRENER") {
        const zawodnik = await Uzytkownik.findById(zawodnikId);
        if (!zawodnik || zawodnik.kategoria !== requester.kategoria) {
          return res.status(403).json({
            message: "Nie możesz edytować statystyk zawodników z innej kategorii"
          });
        }
      }

      const filter: any = { zawodnikId };
      if (sezon) filter.sezon = sezon;

      const update = {
        $set: {
          sezon,
          zolteKartki,
          czerwoneKartki,
          rozegraneMinuty,
          strzeloneBramki,
          odbytychTreningow,
          czysteKonta
        }
      };

      const stat = await Statystyka.findOneAndUpdate(
        filter,
        update,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.json(stat);
    } catch (e) {
      console.error("Błąd zapisu statystyk:", e);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

/**
 * GET /api/statystyki/:zawodnikId
 * Pobierz statystyki konkretnego zawodnika (wszyscy zalogowani)
 * Jeśli przekazany ?sezon=2024/25 – pobieramy dla sezonu.
 */
router.get("/:zawodnikId", authMiddleware, async (req, res) => {
  try {
    const { zawodnikId } = req.params;
    const { sezon } = req.query as { sezon?: string };

    const filter: any = { zawodnikId };
    if (sezon) filter.sezon = sezon;

    const stat = await Statystyka.findOne(filter).populate("zawodnikId", "imie nazwisko email rola kategoria");
    return res.json(stat ?? {});
  } catch (e) {
    console.error("Błąd pobierania statystyk:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * GET /api/statystyki
 * Lista wszystkich statystyk (PREZES widzi wszystkie, TRENER widzi dla swojej kategorii)
 * Query params:
 *   ?sezon=2024/25 - filtruj po sezonie
 *   ?kategoria=U19 - filtruj po kategorii
 *   ?pozycja=BRAMKARZ - filtruj po pozycji
 *   ?zawodnikId=xxx - filtruj po ID zawodnika
 *   ?page=1&limit=10 - paginacja
 */
router.get("/", authMiddleware, sprawdzRole(["PREZES", "TRENER"]), async (req: AuthRequest, res) => {
  try {
    const { sezon, kategoria, pozycja, zawodnikId, page = 1, limit = 100 } = req.query as any;
    const filter: any = {};
    
    if (sezon) filter.sezon = sezon;

    let zawodnikIds: any[] = [];

    if (req.user?.rola === "TRENER") {
      const zawodnicy = await Uzytkownik.find({
        rola: "ZAWODNIK",
        kategoria: req.user?.kategoria
      }).select("_id");
      
      zawodnikIds = zawodnicy.map((z: any) => z._id);
    } else if (req.user?.rola === "PREZES") {
      if (kategoria) {
        const zawodnicy = await Uzytkownik.find({
          rola: "ZAWODNIK",
          kategoria: kategoria
        }).select("_id");
        
        zawodnikIds = zawodnicy.map((z: any) => z._id);
      }
    }

    if (pozycja) {
      const query: any = {
        rola: "ZAWODNIK",
        pozycja: pozycja
      };
      if (zawodnikIds.length > 0) {
        query._id = { $in: zawodnikIds };
      }
      
      const zawodnicy = await Uzytkownik.find(query).select("_id");
      zawodnikIds = zawodnicy.map((z: any) => z._id);
    }

    if (zawodnikId) {
      zawodnikIds = [zawodnikId];
    }

    if (zawodnikIds.length > 0) {
      filter.zawodnikId = { $in: zawodnikIds };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 100));
    const skip = (pageNum - 1) * limitNum;

    const lista = await Statystyka.find(filter)
      .populate("zawodnikId", "imie nazwisko email rola kategoria pozycja")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Statystyka.countDocuments(filter);

    return res.json({
      data: lista,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (e) {
    console.error("Błąd listy statystyk:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * PATCH /api/statystyki/:statystykaId
 * Edytuj istniejące statystyki (PREZES, TRENER)
 * TRENER może edytować tylko statystyki zawodników z JEGO kategorii
 */
router.patch("/:statystykaId",
  authMiddleware,
  sprawdzRole(["PREZES", "TRENER"]),
  async (req: AuthRequest, res) => {
    try {
      const { statystykaId } = req.params;
      const {
        sezon,
        zolteKartki,
        czerwoneKartki,
        rozegraneMinuty,
        strzeloneBramki,
        odbytychTreningow,
        czysteKonta
      } = req.body ?? {};

      const stat = await Statystyka.findById(statystykaId);
      if (!stat) {
        return res.status(404).json({ message: "Statystyki nie znalezione" });
      }

      const requester = await Uzytkownik.findById(req.user?.id);
      
      if (requester?.rola === "TRENER") {
        const zawodnik = await Uzytkownik.findById(stat.zawodnikId);
        if (!zawodnik || zawodnik.kategoria !== requester.kategoria) {
          return res.status(403).json({
            message: "Nie możesz edytować statystyk zawodników z innej kategorii"
          });
        }
      }

      if (sezon !== undefined) stat.sezon = sezon;
      if (zolteKartki !== undefined) stat.zolteKartki = zolteKartki;
      if (czerwoneKartki !== undefined) stat.czerwoneKartki = czerwoneKartki;
      if (rozegraneMinuty !== undefined) stat.rozegraneMinuty = rozegraneMinuty;
      if (strzeloneBramki !== undefined) stat.strzeloneBramki = strzeloneBramki;
      if (odbytychTreningow !== undefined) stat.odbytychTreningow = odbytychTreningow;
      if (czysteKonta !== undefined) stat.czysteKonta = czysteKonta;

      await stat.save();
      
      return res.json(stat);
    } catch (e) {
      console.error("Błąd edycji statystyk:", e);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

export default router;
