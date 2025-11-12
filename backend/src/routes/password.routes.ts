import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { Uzytkownik } from "../models/User";
import { hashPassword, verifyPassword } from "../utils/password";
import { wyslijMaila } from "../utils/mailer";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const router = Router();

const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy email")
});

const resetPasswordSchema = z.object({
  token: z.string().min(10, "Nieprawidłowy token"),
  noweHaslo: z.string().min(8, "Hasło musi mieć min 8 znaków")
});

const changePasswordSchema = z.object({
  staroHaslo: z.string().min(1, "Stare hasło jest wymagane"),
  noweHaslo: z.string().min(8, "Hasło musi mieć min 8 znaków")
});

/**
 * POST /api/password/forgot-password
 * Wysyła mail z linkiem do resetu hasła
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const body = forgotPasswordSchema.parse(req.body);

    const user = await Uzytkownik.findOne({ email: body.email });
    if (!user) {
      return res.json({
        message: "Jeśli email istnieje, wyślemy link do resetu hasła"
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.resetTokenHash = tokenHash;
    user.resetTokenExp = expiresAt;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;
    const html = `
      <h2>Reset hasła</h2>
      <p>Cześć ${user.imie || "użytkowniku"}!</p>
      <p>Kliknij poniższy link, aby zresetować hasło:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
        Zresetuj hasło
      </a>
      <p>Link wygasa za 15 minut.</p>
      <p>Jeśli nie prosiłeś o reset hasła, zignoruj ten email.</p>
      <hr />
      <p>Stworzone przez Mateusza Greczyn</p>
    `;

    await wyslijMaila(user.email, "Reset hasła – Klub Piłkarski", html);

    return res.json({
      message: "Jeśli email istnieje, wyślemy link do resetu hasła"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Błędne dane", errors: error.flatten() });
    }
    console.error("Błąd forget-password:", error);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * POST /api/password/reset-password
 * Resetuje hasło za pomocą tokena
 */
router.post("/reset-password", async (req, res) => {
  try {
    const body = resetPasswordSchema.parse(req.body);

    const tokenHash = crypto
      .createHash("sha256")
      .update(body.token)
      .digest("hex");

    const user = await Uzytkownik.findOne({
      resetTokenHash: tokenHash,
      resetTokenExp: { $gt: new Date() } 
    });

    if (!user) {
      return res.status(400).json({
        message: "Token jest nieprawidłowy lub wygasł"
      });
    }

    const hasloHash = await hashPassword(body.noweHaslo);

    user.hasloHash = hasloHash;
    await Uzytkownik.updateOne(
      { _id: user._id },
      { 
        $set: { hasloHash },
        $unset: { resetTokenHash: "", resetTokenExp: "" }
      }
    );

    const html = `
      <h2>Hasło zostało zmienione</h2>
      <p>Cześć ${user.imie || "użytkowniku"}!</p>
      <p>Twoje hasło zostało pomyślnie zmienione.</p>
      <p>Jeśli to nie ty, skontaktuj się z administratorem.</p>
      <hr />
      <p>Stworzone przez Mateusza Greczyn</p>
    `;

    await wyslijMaila(user.email, "Hasło zmienione – Klub Piłkarski", html);

    return res.json({
      message: "Hasło zostało zmienione pomyślnie"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, messages]: any) => `${field}: ${(messages || [])?.join(', ')}`)
        .join('; ');
      return res.status(400).json({ message: errorMessages || "Błędne dane" });
    }
    console.error("Błąd reset-password:", error);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

/**
 * POST /api/password/change-password
 * Zmiana hasła dla zalogowanego użytkownika
 */
router.post("/change-password", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const body = changePasswordSchema.parse(req.body);

    const user = await Uzytkownik.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: "Użytkownik nie znaleziony" });
    }

    const isValid = await verifyPassword(body.staroHaslo, user.hasloHash);
    if (!isValid) {
      return res.status(401).json({
        message: "Stare hasło jest nieprawidłowe"
      });
    }

    const hasloHash = await hashPassword(body.noweHaslo);
    user.hasloHash = hasloHash;
    await user.save();

    return res.json({
      message: "Hasło zmienione pomyślnie"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const errorMessages = Object.entries(fieldErrors)
        .map(([field, messages]: any) => `${field}: ${(messages || [])?.join(', ')}`)
        .join('; ');
      return res.status(400).json({ message: errorMessages || "Błędne dane" });
    }
    console.error("Błąd change-password:", error);
    return res.status(500).json({ message: "Błąd serwera" });
  }
});

export default router;
