// Role types
export type Role = 'PREZES' | 'TRENER' | 'ZAWODNIK';
export type Position = 'BRAMKARZ' | 'OBRONCA' | 'POMOCNIK' | 'NAPASTNIK';
export type Category = 'U9' | 'U11' | 'U13' | 'U15' | 'U17' | 'U19' | 'SENIOR' | 'BRAK';
export type EventType = 'MECZ_LIGOWY' | 'MECZ_PUCHAROWY' | 'MECZ_SPARINGOWY' | 'TRENING' | 'ZBIÓRKA_PRZEDMECZOWA';
export type Attendance = 'TAK' | 'NIE' | 'BRAK';

// User type
export interface User {
  id: string;
  email: string;
  imie: string;
  nazwisko: string;
  rola: Role;
  kategoria?: Category;
  pozycja?: Position;
  telefon?: string;
  narodowosc?: string;
  contractStart?: Date;
  contractEnd?: Date;
}

// Stats type
export interface Statystyka {
  id: string;
  zawodnikId: string;
  sezon: string;
  rozegraneMinuty: number;
  strzeloneBramki: number;
  zolteKartki: number;
  czerwoneKartki: number;
  odbytychTreningow: number;
  czystKontaCount?: number; // tylko dla bramkarza
  createdAt: Date;
  updatedAt: Date;
}

// Event type
export interface Wydarzenie {
  id: string;
  tytul: string;
  typ: EventType;
  data: Date;
  dataKonca: Date;
  lokalizacja: string;
  opis?: string;
  stworzonyPrzez: string;
  createdAt: Date;
  updatedAt: Date;
}

// Squad type
export interface Squad {
  _id: string;
  eventId: any; // Popolate Wydarzenie
  trener: any; // Populate User
  kategoria: Category;
  podstawowySkład: User[];
  rezerwowi: User[];
  createdAt: Date;
  updatedAt: Date;
}

// Attendance type
export interface Uczestnictwo {
  id: string;
  eventId: string;
  zawodnikId: string;
  odpowiedz: Attendance;
  createdAt: Date;
}

// Auth response
export interface LoginResponse {
  token: string;
  uzytkownik: User;
}
