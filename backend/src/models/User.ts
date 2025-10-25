import { Schema, model, Document } from "mongoose";

export type Rola = "PREZES" | "TRENER" | "ZAWODNIK";
export type Pozycja = "BRAMKARZ" | "OBRONCA" | "POMOCNIK" | "NAPASTNIK" | null;
export type Kategoria =
  | "U9"
  | "U11"
  | "U13"
  | "U15"
  | "U17"
  | "U19"
  | "SENIOR"
  | "BRAK";

export interface IUser extends Document {
  email: string;
  telefon?: string;
  hasloHash: string;
  rola: Rola;
  imie?: string;
  nazwisko?: string;
  narodowosc?: string;
  pozycja?: Pozycja;
  kategoria?: Kategoria;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, unique: true, required: true, index: true },
    telefon: { type: String },
    hasloHash: { type: String, required: true },
    rola: { type: String, enum: ["PREZES", "TRENER", "ZAWODNIK"], required: true },
    imie: { type: String },
    nazwisko: { type: String },
    narodowosc: { type: String },
    pozycja: { type: String, enum: ["BRAMKARZ", "OBRONCA", "POMOCNIK", "NAPASTNIK", null], default: null },
    kategoria: { type: String, enum: ["U9", "U11", "U13", "U15", "U17", "U19", "SENIOR", "BRAK"], default: "BRAK" },
  },
  { timestamps: true }
);

export const Uzytkownik = model<IUser>("Uzytkownik", UserSchema);
