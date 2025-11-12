import mongoose, { Schema, Document } from "mongoose";

export type TypWydarzenia =
  | "MECZ_LIGOWY"
  | "MECZ_PUCHAROWY"
  | "SPARING"
  | "TRENING"
  | "ZBIORKA";

export type StatusUdzialu = "TAK" | "NIE" | "NIEOKRESLONY";

export type Categoria = "U9" | "U11" | "U13" | "U15" | "U17" | "U19" | "SENIOR";

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
  categoria: Categoria;                         
  utworzyl: mongoose.Types.ObjectId;           
  uczestnicy: IUczestnik[];                     
  reminderSent?: boolean;                       
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
    categoria: {
      type: String,
      enum: ["U9", "U11", "U13", "U15", "U17", "U19", "SENIOR"],
      required: true
    },
    utworzyl: { type: Schema.Types.ObjectId, ref: "Uzytkownik", required: true },
    uczestnicy: { type: [UczestnikSchema], default: [] },
    reminderSent: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Wydarzenie = mongoose.model<IWydarzenie>("Wydarzenie", WydarzenieSchema);
