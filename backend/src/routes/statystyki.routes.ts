import { Router } from "express";
import { Statystyka } from "../models/Statystyka";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sprawdzRole } from "../middleware/rola.middleware";

const router = Router();

/**
 * POST /api/statystyki/:zawodnikId
 * Dodaj / zaktualizuj statystyki zawodnika (PREZES, TRENER)
 * Jeżeli podasz "sezon" w body – trzymamy jedną kartę na sezon (upsert).
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

    const stat = await Statystyka.findOne(filter);
    return res.json(stat ?? {});
  } catch (e) {
    console.error("Błąd pobierania statystyk:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * GET /api/statystyki
 * Lista wszystkich statystyk (tylko PREZES)
 * Opcjonalnie ?sezon=2024/25
 */
router.get("/", authMiddleware, sprawdzRole(["PREZES"]), async (req, res) => {
  try {
    const { sezon } = req.query as { sezon?: string };
    const filter: any = {};
    if (sezon) filter.sezon = sezon;

    const lista = await Statystyka.find(filter).populate("zawodnikId", "imie nazwisko email rola");
    return res.json(lista);
  } catch (e) {
    console.error("Błąd listy statystyk:", e);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

export default router;
