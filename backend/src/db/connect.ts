import mongoose from "mongoose";

export const connectDB = async (url: string): Promise<void> => {
  try {
    await mongoose.connect(url);
    console.log("✅ Połączono z bazą danych MongoDB Atlas");
  } catch (error) {
    console.error("❌ Błąd połączenia z bazą:", error);
    process.exit(1);
  }
};
