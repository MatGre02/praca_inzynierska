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

      const sender = await Uzytkownik.findById(req.user?.id);
      if (!sender) {
        return res.status(404).json({ message: "Użytkownik nie znaleziony" });
      }

      const recipients = await Uzytkownik.find({ _id: { $in: body.to } });

      // ZAWODNIK – tylko trener z jego kategorii + prezes
      if (sender.rola === "ZAWODNIK") {
        for (const recipient of recipients) {
          const isValid = 
            (recipient.rola === "PREZES") ||
            (recipient.rola === "TRENER" && recipient.kategoria === sender.kategoria);

          if (!isValid) {
            return res.status(403).json({
              message: "Zawodnicy mogą wysyłać maile tylko do trenera swojej kategorii lub prezesa"
            });
          }
        }
      }

      // TRENER – zawodnicy z jego kategorii + inni trenerzy + prezes
      if (sender.rola === "TRENER") {
        for (const recipient of recipients) {
          const senderIdStr = String(sender._id);
          const recipientIdStr = String(recipient._id);
          
          const isValid = 
            (recipient.rola === "ZAWODNIK" && recipient.kategoria === sender.kategoria) ||
            (recipient.rola === "TRENER" && recipientIdStr !== senderIdStr) ||
            (recipient.rola === "PREZES");

          if (!isValid) {
            return res.status(403).json({
              message: `Trener może wysyłać maile do: zawodników z Twojej kategorii (${sender.kategoria}), innych trenerów i prezesa`
            });
          }
        }
      }

      // PREZES – brak ograniczeń (wszyscy mogą)
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

      if (sender.rola === "TRENER" && body.category !== sender.kategoria) {
        return res.status(403).json({
          message: "Możesz wysyłać maile tylko do swojej kategorii"
        });
      }

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

/**
 * GET /api/mail/recipients
 * Zwraca listę dostępnych odbiorców maili w zależności od roli
 */
router.get(
  "/recipients",
  authMiddleware,
  sprawdzRole(["ZAWODNIK", "TRENER", "PREZES"]),
  async (req: AuthRequest, res) => {
    try {
      const sender = await Uzytkownik.findById(req.user?.id);
      if (!sender) {
        return res.status(404).json({ message: "Użytkownik nie znaleziony" });
      }

      let recipients: any[] = [];

      if (sender.rola === "ZAWODNIK") {
        recipients = await Uzytkownik.find({
          $or: [
            { rola: "PREZES" },
            { rola: "TRENER", kategoria: sender.kategoria }
          ]
        }).select("_id email imie nazwisko rola kategoria");

      } else if (sender.rola === "TRENER") {
        recipients = await Uzytkownik.find({
          $or: [
            { rola: "ZAWODNIK", kategoria: sender.kategoria },
            { rola: "TRENER", _id: { $ne: sender._id } }, 
            { rola: "PREZES" }
          ]
        }).select("_id email imie nazwisko rola kategoria");

      } else if (sender.rola === "PREZES") {
        recipients = await Uzytkownik.find({
          _id: { $ne: sender._id }
        }).select("_id email imie nazwisko rola kategoria");
      }

      recipients.sort((a, b) => {
        const rolaOrder = { PREZES: 0, TRENER: 1, ZAWODNIK: 2 };
        const aOrder = rolaOrder[a.rola as keyof typeof rolaOrder] || 3;
        const bOrder = rolaOrder[b.rola as keyof typeof rolaOrder] || 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a.nazwisko || "").localeCompare(b.nazwisko || "");
      });

      return res.status(200).json({
        message: "Lista dostępnych odbiorców",
        recipients: recipients.map(r => ({
          id: r._id,
          email: r.email,
          imie: r.imie,
          nazwisko: r.nazwisko,
          rola: r.rola,
          kategoria: r.kategoria
        }))
      });
    } catch (error) {
      console.error("Błąd pobierania odbiorców:", error);
      return res.status(500).json({ message: "Błąd serwera", error: String(error) });
    }
  }
);

export default router;
