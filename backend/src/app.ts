import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import statystykiRoutes from "./routes/statystyki.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/status", (req, res) => {
  res.json({ status: "OK", message: "Serwer dziala poprawnie 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/statystyki", statystykiRoutes);
export default app;
