import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./db/connect";

dotenv.config();

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI as string;

const startServer = async () => {
  try {
    await connectDB(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`✅ Serwer działa na porcie ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Błąd przy starcie serwera:", error);
  }
};

startServer();
