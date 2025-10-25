import cron from "node-cron";
import { Wydarzenie } from "../models/Wydarzenie";
import { Uzytkownik } from "../models/User";
import { wyslijMaila } from "../utils/mailer";

export function startReminders() {
  // Codziennie o 09:00
  cron.schedule("0 9 * * *", async () => {
    const teraz = new Date();
    const za48h = new Date(teraz.getTime() + 48 * 60 * 60 * 1000);

    const wydarzenia = await Wydarzenie.find({
      data: { $gte: teraz, $lte: za48h }
    });

    if (!wydarzenia.length) return;

    // Wyślij do wszystkich kont (prezes, trenerzy, zawodnicy)
    const odbiorcy = await Uzytkownik.find({}, "email");
    const maile = odbiorcy.map(u => u.email).filter(Boolean);

    for (const w of wydarzenia) {
      const when = new Date(w.data).toLocaleString();
      const subject = `Przypomnienie: ${w.tytul} (${w.typ}) – ${when}`;
      const html = `
        <p>Cześć,</p>
        <p>Za 2 dni odbędzie się: <b>${w.tytul}</b> [${w.typ}]</p>
        <p>Data: <b>${when}</b></p>
        ${w.opis ? `<p>Opis: ${w.opis}</p>` : ""}
        <p>Pozdrawiamy,<br/>Klub</p>
      `;
      try { 
        await wyslijMaila(maile, subject, html);
      } catch (err) {
        console.error("Błąd wysyłki przypomnienia:", err);
      }
    }
  });
}
