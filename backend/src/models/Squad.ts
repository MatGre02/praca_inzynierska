import mongoose, { Schema, Document } from "mongoose";

export interface ISquad extends Document {
  eventId: mongoose.Types.ObjectId;           // ref do Wydarzenie (unique)
  playerIds: mongoose.Types.ObjectId[];       // lista zawodników (max 18)
  createdBy: mongoose.Types.ObjectId;         // ref do User (trener)
  createdAt: Date;
  updatedAt: Date;
}

const SquadSchema = new Schema<ISquad>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Wydarzenie",
      required: true,
      unique: true,
      index: true
    },
    playerIds: {
      type: [Schema.Types.ObjectId],
      ref: "Uzytkownik",
      default: [],
      validate: {
        validator: function (v: any[]) {
          return Array.isArray(v) && v.length <= 18;
        },
        message: "Kadra meczowa nie może mieć więcej niż 18 zawodników"
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Uzytkownik",
      required: true
    }
  },
  { timestamps: true }
);

export const Squad = mongoose.model<ISquad>("Squad", SquadSchema);
