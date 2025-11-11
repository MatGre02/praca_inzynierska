import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixSquadCollection = async () => {
  try {
    const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017/football-club";
    await mongoose.connect(mongoUrl);

    console.log("✓ Połączenie z bazą danych...");

    const db = mongoose.connection.db;
    if (db) {
      const squadsCollection = db.collection("squads");

      // Usuń wszystkie dokumenty
      try {
        const deleteResult = await squadsCollection.deleteMany({});
        console.log(`✓ Usunięto ${deleteResult.deletedCount} dokumentów`);
      } catch (err) {
        console.log("ℹ️ Brak dokumentów do usunięcia");
      }

      // Usuń wszystkie indeksy
      try {
        const indexes = await squadsCollection.listIndexes().toArray();
        console.log("ℹ️ Istniejące indeksy:", indexes.map(i => i.name));

        for (const index of indexes) {
          if (index.name !== "_id_") {
            await squadsCollection.dropIndex(index.name);
            console.log(`✓ Usunięty indeks: ${index.name}`);
          }
        }
      } catch (err: any) {
        console.log("ℹ️ Błąd przy usuwaniu indeksów:", err.message);
      }

      // Usuń całą kolekcję
      try {
        await squadsCollection.drop();
        console.log("✓ Kolekcja squads została usunięta");
      } catch (err) {
        console.log("ℹ️ Kolekcja squads nie istniała");
      }
    }

    // Zaimpportuj model, aby Mongoose stworzył nową kolekcję z poprawnymi indeksami
    const { Squad } = await import("../models/Squad");
    
    console.log("✓ Model Squad załadowany");

    await mongoose.connection.close();
    console.log("✓ Migracja zakończona pomyślnie!");
  } catch (error) {
    console.error("❌ Błąd migracji:", error);
    process.exit(1);
  }
};

fixSquadCollection();
