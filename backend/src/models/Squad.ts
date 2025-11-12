import mongoose, { Schema, Document } from "mongoose";

export interface ISquad extends Document {
  title: string;                              
  startingEleven: mongoose.Types.ObjectId[];  
  bench: mongoose.Types.ObjectId[];           
  categoria: string;                           
  createdBy: mongoose.Types.ObjectId;         
  createdAt: Date;
  updatedAt: Date;
}

const SquadSchema = new Schema<ISquad>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100
    },
    startingEleven: {
      type: [Schema.Types.ObjectId],
      ref: "Uzytkownik",
      default: [],
      validate: {
        validator: function (v: any[]) {
          return Array.isArray(v) && v.length <= 11;
        },
        message: "Pierwsza jedenastka nie może mieć więcej niż 11 zawodników"
      }
    },
    bench: {
      type: [Schema.Types.ObjectId],
      ref: "Uzytkownik",
      default: [],
      validate: {
        validator: function (v: any[]) {
          return Array.isArray(v) && v.length <= 7;
        },
        message: "Ławka rezerwowych nie może mieć więcej niż 7 zawodników"
      }
    },
    categoria: {
      type: String,
      required: true,
      enum: ["U9", "U11", "U13", "U15", "U17", "U19", "SENIOR"]
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
