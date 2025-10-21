import { z } from "zod";

export const rejestracjaSchema = z.object({
  email: z.string().email(),
  haslo: z.string().min(8, "Haslo musi mieć min. 8 znakow"),
  rola: z.enum(["PREZES", "TRENER", "ZAWODNIK"]),
  imie: z.string().optional(),
  nazwisko: z.string().optional(),
  telefon: z.string().optional(),
  narodowosc: z.string().optional(),
  pozycja: z.enum(["BRAMKARZ", "OBRONCA", "POMOCNIK", "NAPASTNIK"]).optional()
});

export type DaneRejestracji = z.infer<typeof rejestracjaSchema>;

export const logowanieSchema = z.object({
  email: z.string().email(),
  haslo: z.string().min(1)
});
export type DaneLogowania = z.infer<typeof logowanieSchema>;
