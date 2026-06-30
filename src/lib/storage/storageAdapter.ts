export interface SavedDevice {
  label: string;
  kwhPerHour: number;
  hours: number;
  gco2eq: number;
  custom: boolean;
}

export interface SavedDay {
  id: string;
  anonId: string;
  savedAt: string;
  intensityAtSave: number;
  totalGco2eq: number;
  devices: SavedDevice[];
}

export type NewSavedDay = Omit<SavedDay, "id" | "anonId" | "savedAt">;

export interface StorageAdapter {
  listDays(anonId: string): Promise<SavedDay[]>;
  saveDay(anonId: string, day: NewSavedDay): Promise<SavedDay>;
  deleteDay(anonId: string, id: string): Promise<void>;
}
