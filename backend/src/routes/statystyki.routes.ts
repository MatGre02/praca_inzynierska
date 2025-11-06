import { Router } from "express";
import { Statystyka } from "../models/Statystyka";
import { Uzytkownik } from "../models/User";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sprawdzRole } from "../middleware/rola.middleware";

const router = Router();

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

      // Pobierz trenera/prezesa
      const requester = await Uzytkownik.findById(req.user?.id);
      
      // Jeśli TRENER – sprawdź czy zawodnik z jego kategorii
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
 * Opcjonalnie ?sezon=2024/25
 */
router.get("/", authMiddleware, sprawdzRole(["PREZES", "TRENER"]), async (req: AuthRequest, res) => {
  try {
    const { sezon } = req.query as { sezon?: string };
    const filter: any = {};
    if (sezon) filter.sezon = sezon;

    // Jeśli TRENER - filtruj po jego kategorii
    if (req.user?.rola === "TRENER") {
      // Pobierz ID zawodników z kategorii TRENERA
      const zawodnicy = await Uzytkownik.find({
        rola: "ZAWODNIK",
        kategoria: req.user?.kategoria
      }).select("_id");
      
      const zawodnikIds = zawodnicy.map(z => z._id);
      filter.zawodnikId = { $in: zawodnikIds };
    }

    const lista = await Statystyka.find(filter).populate("zawodnikId", "imie nazwisko email rola kategoria");
    return res.json(lista);
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

      // Znajdź statystykę
      const stat = await Statystyka.findById(statystykaId);
      if (!stat) {
        return res.status(404).json({ message: "Statystyki nie znalezione" });
      }

      // Pobierz trenera/prezesa
      const requester = await Uzytkownik.findById(req.user?.id);
      
      // Jeśli TRENER – sprawdź czy zawodnik z jego kategorii
      if (requester?.rola === "TRENER") {
        const zawodnik = await Uzytkownik.findById(stat.zawodnikId);
        if (!zawodnik || zawodnik.kategoria !== requester.kategoria) {
          return res.status(403).json({
            message: "Nie możesz edytować statystyk zawodników z innej kategorii"
          });
        }
      }

      // Aktualizuj pola
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
