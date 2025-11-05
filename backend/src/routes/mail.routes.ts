import { Router } from "express";
import { z } from "zod";
import { Uzytkownik } from "../models/User";
import { wyslijMaila } from "../utils/mailer";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { sprawdzRole } from "../middleware/rola.middleware";

const router = Router();

const sendMailSchema = z.object({
  to: z.array(z.string()).min(1, "Wymagana lista odbiorców"),
  subject: z.string().min(5, "Temat musi mieć min 5 znaków"),
  html: z.string().min(10, "Treść musi mieć min 10 znaków")
});

/**
 * POST /api/mail/send
 * Wysyła mail z ograniczeniami w zależności od roli:
 * 
 * ZAWODNIK:
 *   - Może wysłać TYLKO do: trenera z JEGO kategorii + PREZES
 *   - Nie może do innych zawodników
 * 
 * TRENER:
 *   - Może wysłać do: zawodników z JEGO kategorii + inni TRENERZY + PREZES
 * 
 * PREZES:
 *   - Brak ograniczeń, może do wszystkich
 */
router.post(
  "/send",
  authMiddleware,
  sprawdzRole(["ZAWODNIK", "TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const body = sendMailSchema.parse(req.body);

      // Pobierz obsługującego użytkownika
      const sender = await Uzytkownik.findById(req.user?.id);
      if (!sender) {
        return res.status(404).json({ message: "Użytkownik nie znaleziony" });
      }

      // Pobierz odbiorców
      const recipients = await Uzytkownik.find({ _id: { $in: body.to } });

      // ZAWODNIK – tylko trener z jego kategorii + prezes
      if (sender.rola === "ZAWODNIK") {
        for (const recipient of recipients) {
          // ❌ Zawodnik nie może wysłać do innego zawodnika
          if (recipient.rola === "ZAWODNIK") {
            return res.status(403).json({
              message: "Zawodnicy nie mogą wysyłać maili między sobą"
            });
          }

          // ❌ Zawodnik nie może wysłać do trenera z innej kategorii
          if (
            recipient.rola === "TRENER" &&
            recipient.kategoria !== sender.kategoria
          ) {
            return res.status(403).json({
              message: `Możesz wysłać mail tylko do trenera swojej kategorii (${sender.kategoria})`
            });
          }

          // ✅ Zawodnik może do PREZES-a
          if (recipient.rola !== "PREZES" && recipient.rola !== "TRENER") {
            return res.status(403).json({
              message: "Nieprawidłowy odbiorca"
            });
          }
        }
      }

      // TRENER – zawodnicy z jego kategorii + inni trenerzy + prezes
      if (sender.rola === "TRENER") {
        for (const recipient of recipients) {
          // ❌ Trener nie może wysłać do zawodnika z innej kategorii
          if (
            recipient.rola === "ZAWODNIK" &&
            recipient.kategoria !== sender.kategoria
          ) {
            return res.status(403).json({
              message: `Możesz wysyłać maile tylko do zawodników z Twojej kategorii (${sender.kategoria})`
            });
          }

          // ✅ Trener może do innego trenera
          // ✅ Trener może do PREZES-a
          // ✅ Trener może do zawodnika z jego kategorii
        }
      }

      // PREZES – brak ograniczeń (wszyscy mogą)

      // Wysyłanie maili
      const emails = recipients.map(r => r.email).filter(Boolean);

      if (emails.length === 0) {
        return res.status(400).json({ message: "Brak prawidłowych adresów email wśród odbiorców" });
      }

      await wyslijMaila(emails, body.subject, body.html);

      return res.status(200).json({
        message: "Mail wysłany pomyślnie",
        sentTo: emails.length,
        recipients: recipients.map(r => ({
          id: r.id,
          email: r.email,
          imie: r.imie,
          nazwisko: r.nazwisko
        }))
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Błędne dane", errors: error.flatten() });
      }
      console.error("Błąd wysyłki maila:", error);
      return res.status(500).json({ message: "Błąd serwera", error: String(error) });
    }
  }
);

/**
 * POST /api/mail/send-category
 * Wysyła mail do wszystkich użytkowników danej kategorii (PREZES, TRENER)
 */
router.post(
  "/send-category",
  authMiddleware,
  sprawdzRole(["PREZES", "TRENER"]),
  async (req: AuthRequest, res) => {
    try {
      const body = z.object({
        category: z.string().min(1, "Wymagana kategoria"),
        subject: z.string().min(5, "Temat musi mieć min 5 znaków"),
        html: z.string().min(10, "Treść musi mieć min 10 znaków")
      }).parse(req.body);

      const sender = await Uzytkownik.findById(req.user?.id);
      if (!sender) {
        return res.status(404).json({ message: "Użytkownik nie znaleziony" });
      }

      // TRENER – może wysłać tylko do swojej kategorii
      if (sender.rola === "TRENER" && body.category !== sender.kategoria) {
        return res.status(403).json({
          message: "Możesz wysyłać maile tylko do swojej kategorii"
        });
      }

      // Pobierz użytkowników z kategorii
      const recipients = await Uzytkownik.find({ kategoria: body.category });

      if (recipients.length === 0) {
        return res.status(400).json({ message: "Brak użytkowników w tej kategorii" });
      }

      const emails = recipients.map(r => r.email).filter(Boolean);

      await wyslijMaila(emails, body.subject, body.html);

      return res.status(200).json({
        message: "Mail wysłany do kategorii",
        sentTo: emails.length,
        category: body.category
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Błędne dane", errors: error.flatten() });
      }
      console.error("Błąd wysyłki maila:", error);
      return res.status(500).json({ message: "Błąd serwera", error: String(error) });
    }
  }
);

export default router;
