import cron from "node-cron";
import { Wydarzenie } from "../models/Wydarzenie";
import { Uzytkownik } from "../models/User";
import { wyslijMaila } from "../utils/mailer";

export function startReminders() {
  console.log("🔔 System przypomnień AKTYWNY - sprawdza co godzinę o :00");
  
  cron.schedule("0 * * * *", async () => {
    try {
      console.log(`\n[${new Date().toLocaleString('pl-PL')}] 🔍 Sprawdzam przypomnienia...`);
      
      const teraz = new Date();
      const za48h = new Date(teraz.getTime() + 48 * 60 * 60 * 1000);

      console.log(`  ⏰ Teraz: ${teraz.toLocaleString('pl-PL')}`);
      console.log(`  ⏰ Za 48h: ${za48h.toLocaleString('pl-PL')}`);

      const wydarzenia = await Wydarzenie.find({
        data: { $gte: teraz, $lte: za48h },
        reminderSent: false
      }).populate("uczestnicy.zawodnik", "email imie nazwisko");

      console.log(`  📅 Znaleziono ${wydarzenia.length} zdarzeń do wysłania`);

      if (!wydarzenia.length) {
        console.log("  ✅ Brak zdarzeń - czekam dalej");
        return;
      }

      for (const w of wydarzenia) {
        const when = new Date(w.data).toLocaleString('pl-PL');
        const subject = `Przypomnienie: ${w.tytul} – ${when}`;
        const html = `
          <p>Cześć,</p>
          <p>Za 2 dni odbędzie się: <b>${w.tytul}</b> (${w.typ})</p>
          <p>Data: <b>${when}</b></p>
          <p>Kategoria: <b>${w.categoria}</b></p>
          ${w.lokalizacja ? `<p>Miejsce: ${w.lokalizacja}</p>` : ""}
          ${w.opis ? `<p>Opis: ${w.opis}</p>` : ""}
          <p>Pozdrawiamy,<br/>Klub</p>
        `;
        
        try {
          const uczestnicyTAK = w.uczestnicy.filter((u: any) => u.status === "TAK").map((u: any) => u.zawodnik);
          const maileZawodnikow = (uczestnicyTAK as any[])
            .map(u => u.email)
            .filter(Boolean);
          
          const trener = await Uzytkownik.findOne({ 
            rola: "TRENER", 
            kategoria: w.categoria 
          });
          
          const prezes = await Uzytkownik.findOne({ rola: "PREZES" });
          
          const maile: string[] = [
            ...maileZawodnikow,
            ...(trener?.email ? [trener.email] : []),
            ...(prezes?.email ? [prezes.email] : [])
          ];
          
          const unikatneMaile = [...new Set(maile)];
          
          console.log(`  📧 ${w.tytul}: ${unikatneMaile.length} odbiorców`);
          console.log(`    - Zawodnicy: ${maileZawodnikow.length}`);
          console.log(`    - Trener: ${trener?.email || 'brak'}`);
          console.log(`    - Prezes: ${prezes?.email || 'brak'}`);
          
          if (unikatneMaile.length) {
            await wyslijMaila(unikatneMaile, subject, html);
            console.log(`    ✅ Mail wysłany do: ${unikatneMaile.join(', ')}`);
          }
          
          w.reminderSent = true;
          await w.save();
          console.log(`    ✅ reminderSent = true`);
        } catch (err) {
          console.error(`    ❌ Błąd wysyłki dla ${w.tytul}:`, err);
        }
      }
    } catch (error) {
      console.error("❌ Błąd w cronjob:", error);
    }
  });
}
