import { Router } from "express";
import { Uzytkownik } from "../models/User";
import { Statystyka } from "../models/Statystyka";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { tylkoPrezes } from "../middleware/rola.middleware";

const router = Router();

/**
 * GET /api/reports/players
 * Generuje raport ze wszystkimi danymi zawodników + statystykami (tylko PREZES)
 * Query params: ?format=json|csv&sezon=2024/25
 */
router.get(
  "/players",
  authMiddleware,
  tylkoPrezes,
  async (req: AuthRequest, res) => {
    try {
      const { format = "json", sezon } = req.query as { format?: string; sezon?: string };

      // Pobierz wszystkich zawodników
      const zawodnicy = await Uzytkownik.find({ rola: "ZAWODNIK" }).select(
        "-hasloHash -resetTokenHash -resetTokenExp"
      );

      // Dla każdego zawodnika pobierz statystyki
      const report = await Promise.all(
        zawodnicy.map(async (z) => {
          const filter: any = { zawodnikId: z._id };
          if (sezon) filter.sezon = sezon;

          const statystyka = await Statystyka.findOne(filter);

          return {
            userId: z._id,
            email: z.email,
            imie: z.imie,
            nazwisko: z.nazwisko,
            telefon: z.telefon,
            narodowosc: z.narodowosc,
            pozycja: z.pozycja,
            kategoria: z.kategoria,
            contractStart: z.contractStart,
            contractEnd: z.contractEnd,
            statystyki: statystyka
              ? {
                  sezon: statystyka.sezon,
                  zolteKartki: statystyka.zolteKartki,
                  czerwoneKartki: statystyka.czerwoneKartki,
                  rozegraneMinuty: statystyka.rozegraneMinuty,
                  strzeloneBramki: statystyka.strzeloneBramki,
                  odbytychTreningow: statystyka.odbytychTreningow,
                  czysteKonta: statystyka.czysteKonta
                }
              : null
          };
        })
      );

      // JSON format
      if (format === "json") {
        return res.json({
          format: "json",
          generatedAt: new Date().toISOString(),
          sezon: sezon || "wszystkie sezony",
          total: report.length,
          data: report
        });
      }

      // CSV format
      if (format === "csv") {
        const csv = generateCSV(report, sezon);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="raport_zawodnikow_${new Date().toISOString().split("T")[0]}.csv"`
        );
        return res.send(csv);
      }

      return res.status(400).json({
        message: "Nieprawidłowy format. Użyj: json lub csv"
      });
    } catch (error) {
      console.error("Błąd generowania raportu:", error);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

/**
 * GET /api/reports/category/:category
 * Raport dla konkretnej kategorii (PREZES)
 */
router.get(
  "/category/:category",
  authMiddleware,
  tylkoPrezes,
  async (req: AuthRequest, res) => {
    try {
      const { category } = req.params;
      const { format = "json", sezon } = req.query as { format?: string; sezon?: string };

      // Pobierz zawodników z kategorii
      const zawodnicy = await Uzytkownik.find({
        rola: "ZAWODNIK",
        kategoria: category
      }).select("-hasloHash -resetTokenHash -resetTokenExp");

      // Dla każdego zawodnika pobierz statystyki
      const report = await Promise.all(
        zawodnicy.map(async (z) => {
          const filter: any = { zawodnikId: z._id };
          if (sezon) filter.sezon = sezon;

          const statystyka = await Statystyka.findOne(filter);

          return {
            userId: z._id,
            email: z.email,
            imie: z.imie,
            nazwisko: z.nazwisko,
            telefon: z.telefon,
            narodowosc: z.narodowosc,
            pozycja: z.pozycja,
            contractStart: z.contractStart,
            contractEnd: z.contractEnd,
            statystyki: statystyka
              ? {
                  sezon: statystyka.sezon,
                  zolteKartki: statystyka.zolteKartki,
                  czerwoneKartki: statystyka.czerwoneKartki,
                  rozegraneMinuty: statystyka.rozegraneMinuty,
                  strzeloneBramki: statystyka.strzeloneBramki,
                  odbytychTreningow: statystyka.odbytychTreningow,
                  czysteKonta: statystyka.czysteKonta
                }
              : null
          };
        })
      );

      // JSON format
      if (format === "json") {
        return res.json({
          format: "json",
          generatedAt: new Date().toISOString(),
          category,
          sezon: sezon || "wszystkie sezony",
          total: report.length,
          data: report
        });
      }

      // CSV format
      if (format === "csv") {
        const csv = generateCSV(report, sezon, category);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="raport_${category}_${new Date().toISOString().split("T")[0]}.csv"`
        );
        return res.send(csv);
      }

      return res.status(400).json({
        message: "Nieprawidłowy format. Użyj: json lub csv"
      });
    } catch (error) {
      console.error("Błąd generowania raportu:", error);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

/**
 * GET /api/reports/position/:position
 * Raport zawodników na danej pozycji (PREZES)
 */
router.get(
  "/position/:position",
  authMiddleware,
  tylkoPrezes,
  async (req: AuthRequest, res) => {
    try {
      const { position } = req.params;
      const { format = "json", sezon } = req.query as { format?: string; sezon?: string };

      // Pobierz zawodników z pozycji
      const zawodnicy = await Uzytkownik.find({
        rola: "ZAWODNIK",
        pozycja: position
      }).select("-hasloHash -resetTokenHash -resetTokenExp");

      // Dla każdego zawodnika pobierz statystyki
      const report = await Promise.all(
        zawodnicy.map(async (z) => {
          const filter: any = { zawodnikId: z._id };
          if (sezon) filter.sezon = sezon;

          const statystyka = await Statystyka.findOne(filter);

          return {
            userId: z._id,
            email: z.email,
            imie: z.imie,
            nazwisko: z.nazwisko,
            telefon: z.telefon,
            narodowosc: z.narodowosc,
            kategoria: z.kategoria,
            contractStart: z.contractStart,
            contractEnd: z.contractEnd,
            statystyki: statystyka
              ? {
                  sezon: statystyka.sezon,
                  zolteKartki: statystyka.zolteKartki,
                  czerwoneKartki: statystyka.czerwoneKartki,
                  rozegraneMinuty: statystyka.rozegraneMinuty,
                  strzeloneBramki: statystyka.strzeloneBramki,
                  odbytychTreningow: statystyka.odbytychTreningow,
                  czysteKonta: statystyka.czysteKonta
                }
              : null
          };
        })
      );

      // JSON format
      if (format === "json") {
        return res.json({
          format: "json",
          generatedAt: new Date().toISOString(),
          position,
          sezon: sezon || "wszystkie sezony",
          total: report.length,
          data: report
        });
      }

      // CSV format
      if (format === "csv") {
        const csv = generateCSV(report, sezon, `pozycja_${position}`);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="raport_${position}_${new Date().toISOString().split("T")[0]}.csv"`
        );
        return res.send(csv);
      }

      return res.status(400).json({
        message: "Nieprawidłowy format. Użyj: json lub csv"
      });
    } catch (error) {
      console.error("Błąd generowania raportu:", error);
      return res.status(500).json({ message: "Błąd serwera" });
    }
  }
);

/**
 * Funkcja pomocnicza generowania CSV
 */
function generateCSV(
  data: any[],
  sezon?: string,
  filter?: string
): string {
  if (data.length === 0) {
    return "Brak danych do raportu";
  }

  // Header
  const headers = [
    "ID",
    "Email",
    "Imię",
    "Nazwisko",
    "Telefon",
    "Narodowość",
    "Pozycja",
    "Kategoria",
    "Kontrakt od",
    "Kontrakt do",
    "Żółte kartki",
    "Czerwone kartki",
    "Rozegrane minuty",
    "Strzelone bramki",
    "Odbyte treningi",
    "Czyste konta"
  ];

  // Escape CSV values
  const escapeCSV = (value: any) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Rows
  const rows = data.map((row) => [
    escapeCSV(row.userId),
    escapeCSV(row.email),
    escapeCSV(row.imie),
    escapeCSV(row.nazwisko),
    escapeCSV(row.telefon),
    escapeCSV(row.narodowosc),
    escapeCSV(row.pozycja),
    escapeCSV(row.kategoria),
    escapeCSV(row.contractStart ? new Date(row.contractStart).toLocaleDateString("pl-PL") : ""),
    escapeCSV(row.contractEnd ? new Date(row.contractEnd).toLocaleDateString("pl-PL") : ""),
    escapeCSV(row.statystyki?.zolteKartki || 0),
    escapeCSV(row.statystyki?.czerwoneKartki || 0),
    escapeCSV(row.statystyki?.rozegraneMinuty || 0),
    escapeCSV(row.statystyki?.strzeloneBramki || 0),
    escapeCSV(row.statystyki?.odbytychTreningow || 0),
    escapeCSV(row.statystyki?.czysteKonta || "")
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  return csv;
}

export default router;
