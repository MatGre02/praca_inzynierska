import { Router } from "express";
import { z } from "zod";
import { Squad } from "../models/Squad";
import { Wydarzenie } from "../models/Wydarzenie";
import { Uzytkownik } from "../models/User";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sprawdzRole } from "../middleware/rola.middleware";

const router = Router();

const squabSchema = z.object({
  eventId: z.string().min(1, "Wymagane eventId"),
  playerIds: z.array(z.string()).max(18, "Maksymalnie 18 zawodników").optional()
});

/**
 * POST /api/squads
 * Tworzy kadę meczową dla meczu (TRENER, PREZES)
 * Jeśli już istnieje – aktualizuje (upsert)
 */
router.post(
  "/",
  authMiddleware,
  sprawdzRole(["TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const body = squabSchema.parse(req.body);

      // Sprawdź czy event istnieje
      const event = await Wydarzenie.findById(body.eventId);
      if (!event) {
        return res.status(404).json({ message: "Wydarzenie nie znalezione" });
      }

      // Jeśli to TRENER – może tworzyć tylko dla swojej kategorii
      if (req.user?.rola === "TRENER") {
        // Pobierz zawodników z bazy, aby sprawdzić kategorię
        const players = await Uzytkownik.find({ _id: { $in: body.playerIds || [] } });
        const trenerCategory = (await Uzytkownik.findById(req.user.id))?.kategoria;

        for (const player of players) {
          if (player.kategoria !== trenerCategory) {
            return res.status(403).json({
              message: "Nie możesz dodawać zawodników z innej kategorii"
            });
          }
        }
      }

      // Upsert – jeśli istnieje aktualizuj, jeśli nie to twórz
      const squad = await Squad.findOneAndUpdate(
        { eventId: body.eventId },
        {
          eventId: body.eventId,
          playerIds: body.playerIds || [],
          createdBy: req.user?.id
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate("playerIds", "imie nazwisko pozycja");

      return res.status(201).json(squad);
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
 * GET /api/squads/:eventId
 * Pobiera kadę meczową dla danego meczu (wszyscy)
 */
router.get("/:eventId", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const squad = await Squad.findOne({ eventId: req.params.eventId })
      .populate("playerIds", "imie nazwisko pozycja email")
      .populate("createdBy", "imie nazwisko rola");

    if (!squad) {
      return res.json({
        message: "Kadra nie została jeszcze stworzona",
        playerIds: []
      });
    }

    return res.json(squad);
  } catch (error) {
    console.error("Błąd pobierania kadry:", error);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * PATCH /api/squads/:eventId
 * Aktualizuje kadę meczową (TRENER – tylko swojej kategorii, PREZES)
 */
router.patch(
  "/:eventId",
  authMiddleware,
  sprawdzRole(["TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const body = squabSchema.parse(req.body);

      const squad = await Squad.findOne({ eventId: req.params.eventId });
      if (!squad) {
        return res.status(404).json({ message: "Kadra nie znaleziona" });
      }

      // Jeśli TRENER – może edytować tylko jeśli to on ją stworzył i jego kategoria
      if (req.user?.rola === "TRENER") {
        if (String(squad.createdBy) !== String(req.user.id)) {
          return res.status(403).json({
            message: "Nie masz uprawnień do edycji tej kadry"
          });
        }

        // Sprawdź kategorię zawodników
        const players = await Uzytkownik.find({ _id: { $in: body.playerIds || [] } });
        const trenerCategory = (await Uzytkownik.findById(req.user.id))?.kategoria;

        for (const player of players) {
          if (player.kategoria !== trenerCategory) {
            return res.status(403).json({
              message: "Nie możesz dodawać zawodników z innej kategorii"
            });
          }
        }
      }

      // Aktualizuj
      squad.playerIds = (body.playerIds || []).map(id => new (require("mongoose").Types.ObjectId)(id));
      await squad.save();

      const updated = await squad.populate("playerIds", "imie nazwisko pozycja email");

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
 * DELETE /api/squads/:eventId
 * Usuwa kadę meczową (TRENER – tylko swojej, PREZES)
 */
router.delete(
  "/:eventId",
  authMiddleware,
  sprawdzRole(["TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const squad = await Squad.findOne({ eventId: req.params.eventId });
      if (!squad) {
        return res.status(404).json({ message: "Kadra nie znaleziona" });
      }

      // Jeśli TRENER – może usunąć tylko swoją
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
