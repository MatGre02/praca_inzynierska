import mongoose, { Schema, Document } from "mongoose";

export type TypWydarzenia =
  | "MECZ_LIGOWY"
  | "MECZ_PUCHAROWY"
  | "SPARING"
  | "TRENING"
  | "ZBIORKA";

export type StatusUdzialu = "TAK" | "NIE" | "NIEOKRESLONY";

export interface IUczestnik {
  zawodnik: mongoose.Types.ObjectId;
  status: StatusUdzialu;
}

export interface IWydarzenie extends Document {
  tytul: string;
  opis?: string;
  typ: TypWydarzenia;
  data: Date;
  dataKonca?: Date;
  lokalizacja?: string;
  utworzyl: mongoose.Types.ObjectId;           // ref do Uzytkownik (prezes/trener)
  uczestnicy: IUczestnik[];                     // tylko dla TRENING – inni też mogą, ale nie wymagane
  reminderSent?: boolean;                       // flaga dla crona
}

const UczestnikSchema = new Schema<IUczestnik>({
  zawodnik: { type: Schema.Types.ObjectId, ref: "Uzytkownik", required: true },
  status: { type: String, enum: ["TAK", "NIE", "NIEOKRESLONY"], default: "NIEOKRESLONY" }
});

const WydarzenieSchema = new Schema<IWydarzenie>(
  {
    tytul: { type: String, required: true },
    opis: String,
    typ: {
      type: String,
      enum: ["MECZ_LIGOWY", "MECZ_PUCHAROWY", "SPARING", "TRENING", "ZBIORKA"],
      required: true
    },
    data: { type: Date, required: true },
    dataKonca: { type: Date },
    lokalizacja: { type: String },
    utworzyl: { type: Schema.Types.ObjectId, ref: "Uzytkownik", required: true },
    uczestnicy: { type: [UczestnikSchema], default: [] },
    reminderSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Wydarzenie = mongoose.model<IWydarzenie>("Wydarzenie", WydarzenieSchema);
