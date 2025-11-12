import mongoose, { Schema, Document } from "mongoose";

export interface IStatystyka extends Document {
  zawodnikId: mongoose.Types.ObjectId;  
  sezon?: string;                        
  zolteKartki: number;
  czerwoneKartki: number;
  rozegraneMinuty: number;
  strzeloneBramki: number;
  odbytychTreningow: number;
  czysteKonta?: number;                 
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

StatystykaSchema.index({ zawodnikId: 1, sezon: 1 }, { unique: true, partialFilterExpression: { sezon: { $exists: true } } });

export const Statystyka = mongoose.model<IStatystyka>("Statystyka", StatystykaSchema);
