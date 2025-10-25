import mongoose, { Schema, Document } from "mongoose";

export interface IStatystyka extends Document {
  zawodnikId: mongoose.Types.ObjectId;  // ref do Uzytkownik
  sezon?: string;                        // opcjonalnie (np. 2024/25)
  zolteKartki: number;
  czerwoneKartki: number;
  rozegraneMinuty: number;
  strzeloneBramki: number;
  odbytychTreningow: number;
  czysteKonta?: number;                  // dla bramkarza
}

const StatystykaSchema = new Schema<IStatystyka>(
  {
    zawodnikId: { type: Schema.Types.ObjectId, ref: "Uzytkownik", required: true, index: true },
    sezon: { type: String },
    zolteKartki: { type: Number, default: 0 },
    czerwoneKartki: { type: Number, default: 0 },
    rozegraneMinuty: { type: Number, default: 0 },
    strzeloneBramki: { type: Number, default: 0 },
    odbytychTreningow: { type: Number, default: 0 },
    czysteKonta: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Jedna karta statystyk na zawodnika na sezon (jeśli podasz sezon)
StatystykaSchema.index({ zawodnikId: 1, sezon: 1 }, { unique: true, partialFilterExpression: { sezon: { $exists: true } } });

export const Statystyka = mongoose.model<IStatystyka>("Statystyka", StatystykaSchema);
