import * as jwt from "jsonwebtoken";

export type DaneTokena = {
  sub: string;
  rola: "PREZES" | "TRENER" | "ZAWODNIK";
  kategoria?: string | "BRAK";
};

export const generujJwt = (dane: DaneTokena): string => {
  const JWT_SECRET = process.env.JWT_SECRET;
  const JWT_EXPIRES = process.env.JWT_EXPIRES || "1h";

  if (!JWT_SECRET) {
    throw new Error("Brak JWT_SECRET w zmiennych środowiskowych");
  }

  const opcje = {
    expiresIn: JWT_EXPIRES
  } as jwt.SignOptions;

  return jwt.sign(dane, JWT_SECRET as jwt.Secret, opcje);
};

export const sprawdzJwt = (token: string): DaneTokena => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("Brak JWT_SECRET w zmiennych środowiskowych");
  }

  return jwt.verify(token, JWT_SECRET as jwt.Secret) as DaneTokena;
};
