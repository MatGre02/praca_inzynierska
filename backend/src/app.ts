import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import passwordRoutes from "./routes/password.routes";
import adminRoutes from "./routes/admin.routes";
import statystykiRoutes from "./routes/statystyki.routes";
import wydarzeniaRoutes from "./routes/wydarzenia.routes";
import squadsRoutes from "./routes/squads.routes";
import mailRoutes from "./routes/mail.routes";
import reportsRoutes from "./routes/reports.routes";

const app = express();

// Bezpieczeństwo: nagłówki HTTP
app.use(helmet());

// CORS
app.use(cors());

// Middleware do parsowania JSON
app.use(express.json());

// Rate limiting - domyślny limit dla wszystkich requestów
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 10000, // max 100 requestów na IP
  message: "Zbyt wiele żądań z tego IP, spróbuj później",
  standardHeaders: true, // zwróć info o limitzie w `RateLimit-*` headerach
  legacyHeaders: false // wyłącz `X-RateLimit-*` headery
});

// Rate limiting - ostrzejszy dla logowania/rejestracji
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 10000, // max 100 prób na IP
  message: "Zbyt wiele prób logowania/rejestracji, spróbuj za 15 minut",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: any) => {
    // Nie limituj GET requests
    return req.method === "GET";
  }
});

// Rate limiting - dla wysyłania maili
const mailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 godzina
  max: 1000, // max 10 maili na godzinę z jednego IP
  message: "Zbyt wiele wysłanych maili, spróbuj później",
  standardHeaders: true,
  legacyHeaders: false
});

// Stosuj rate limiting
app.use("/api/", generalLimiter);
app.use("/api/auth/", authLimiter);
app.use("/api/password/", authLimiter);
app.use("/api/mail/", mailLimiter);

app.get("/api/status", (req, res) => {
  res.json({ status: "OK", message: "Serwer dziala poprawnie 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/statystyki", statystykiRoutes);
app.use("/api/wydarzenia", wydarzeniaRoutes);
app.use("/api/squads", squadsRoutes);
app.use("/api/mail", mailRoutes);
app.use("/api/reports", reportsRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Błąd:", err);
  
  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({ message: "Błąd walidacji", errors: err.errors });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({ message: "Rekord z tą wartością już istnieje" });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Nieprawidłowy token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token wygasł" });
  }

  // Default error
  return res.status(err.status || 500).json({
    message: err.message || "Błąd serwera",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

export default app;
