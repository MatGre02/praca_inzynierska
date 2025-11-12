import { Router } from "express";
import { z } from "zod";
import { Squad } from "../models/Squad";
import { Uzytkownik } from "../models/User";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sprawdzRole } from "../middleware/rola.middleware";

const router = Router();

const squadSchema = z.object({
  title: z.string().min(3, "Tytuł musi mieć minimum 3 znaki").max(100, "Tytuł nie może być dłuższy niż 100 znaków"),
  startingEleven: z.array(z.string()).max(11, "Pierwsza jedenastka - maksymalnie 11 zawodników"),
  bench: z.array(z.string()).max(7, "Ławka rezerwowych - maksymalnie 7 zawodników"),
  categoria: z.string().optional()
});

/**
 * POST /api/squads
 * Tworzy kadę meczową (TRENER, PREZES)
 */
router.post(
  "/",
  authMiddleware,
  sprawdzRole(["TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const body = squadSchema.parse(req.body);

      const allPlayerIds = [...body.startingEleven, ...body.bench];

      if (req.user?.rola === "TRENER") {
        const players = await Uzytkownik.find({ _id: { $in: allPlayerIds } });
        const trenerCategory = (await Uzytkownik.findById(req.user.id))?.kategoria;

        for (const player of players) {
          if (player.kategoria !== trenerCategory) {
            return res.status(403).json({
              message: "Nie możesz dodawać zawodników z innej kategorii"
            });
          }
        }
      }

      const trener = await Uzytkownik.findById(req.user?.id);
      const squad = new Squad({
        title: body.title,
        startingEleven: body.startingEleven,
        bench: body.bench,
        categoria: body.categoria || trener?.kategoria,
        createdBy: req.user?.id
      });

      await squad.save();

      const populated = await squad.populate([
        { path: "startingEleven", select: "imie nazwisko pozycja email" },
        { path: "bench", select: "imie nazwisko pozycja email" },
        { path: "createdBy", select: "imie nazwisko rola" }
      ]);

      return res.status(201).json(populated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Błędne dane", errors: error.flatten() });
      }
      console.error("Błąd tworzenia kadry:", error);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

/**
 * GET /api/squads
 * Pobiera kadry - dla TRENERA jego kadry, dla ZAWODNIKA ze jego kategorii, dla PREZESA wszystkie
 */
router.get(
  "/",
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      let query: any = {};

      if (req.user?.rola === "TRENER") {
        query.createdBy = req.user.id;
      }
      else if (req.user?.rola === "ZAWODNIK") {
        query.categoria = req.user.kategoria;
      }

      const squads = await Squad.find(query)
        .populate("startingEleven", "imie nazwisko pozycja email")
        .populate("bench", "imie nazwisko pozycja email")
        .populate("createdBy", "imie nazwisko")
        .sort({ createdAt: -1 });

      return res.json(squads);
    } catch (error) {
      console.error("Błąd pobierania kadr:", error);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

/**
 * GET /api/squads/:id
 * Pobiera konkretną kadrę (wszyscy)
 */
router.get("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const squad = await Squad.findById(req.params.id)
      .populate("startingEleven", "imie nazwisko pozycja email")
      .populate("bench", "imie nazwisko pozycja email")
      .populate("createdBy", "imie nazwisko rola");

    if (!squad) {
      return res.status(404).json({ message: "Kadra nie znaleziona" });
    }

    return res.json(squad);
  } catch (error) {
    console.error("Błąd pobierania kadry:", error);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * PATCH /api/squads/:id
 * Aktualizuje kadę meczową (TRENER – tylko swoją, PREZES)
 */
router.patch(
  "/:id",
  authMiddleware,
  sprawdzRole(["TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const body = squadSchema.parse(req.body);

      const squad = await Squad.findById(req.params.id);
      if (!squad) {
        return res.status(404).json({ message: "Kadra nie znaleziona" });
      }

      if (req.user?.rola === "TRENER") {
        if (String(squad.createdBy) !== String(req.user.id)) {
          return res.status(403).json({
            message: "Nie masz uprawnień do edycji tej kadry"
          });
        }

        const allPlayerIds = [...body.startingEleven, ...body.bench];
        const players = await Uzytkownik.find({ _id: { $in: allPlayerIds } });
        const trenerCategory = (await Uzytkownik.findById(req.user.id))?.kategoria;

        for (const player of players) {
          if (player.kategoria !== trenerCategory) {
            return res.status(403).json({
              message: "Nie możesz dodawać zawodników z innej kategorii"
            });
          }
        }
      }

      squad.title = body.title;
      squad.startingEleven = body.startingEleven.map(id => new (require("mongoose").Types.ObjectId)(id));
      squad.bench = body.bench.map(id => new (require("mongoose").Types.ObjectId)(id));
      await squad.save();

      const updated = await squad.populate([
        { path: "startingEleven", select: "imie nazwisko pozycja email" },
        { path: "bench", select: "imie nazwisko pozycja email" },
        { path: "createdBy", select: "imie nazwisko" }
      ]);

      return res.json({
        message: "Kadra meczowa zaktualizowana",
        squad: updated
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Błędne dane", errors: error.flatten() });
      }
      console.error("Błąd aktualizacji kadry:", error);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

/**
 * DELETE /api/squads/:id
 * Usuwa kadę meczową (TRENER – tylko swoją, PREZES)
 */
router.delete(
  "/:id",
  authMiddleware,
  sprawdzRole(["TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const squad = await Squad.findById(req.params.id);
      if (!squad) {
        return res.status(404).json({ message: "Kadra nie znaleziona" });
      }

      if (req.user?.rola === "TRENER" && String(squad.createdBy) !== String(req.user.id)) {
        return res.status(403).json({
          message: "Nie masz uprawnień do usunięcia tej kadry"
        });
      }

      await Squad.deleteOne({ _id: squad._id });

      return res.json({ message: "Kadra meczowa usunięta" });
    } catch (error) {
      console.error("Błąd usuwania kadry:", error);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

export default router;
