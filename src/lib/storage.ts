export interface SavedDeviceEntry {
  label: string;
  kwhPerHour: number;
  hours: number;
  gco2eq: number;
  custom: boolean;
}

export interface SavedDay {
  id: string;
  savedAt: string;
  intensityAtSave: number;
  totalGco2eq: number;
  devices: SavedDeviceEntry[];
}

const STORAGE_KEY = "ecopulse:saved-days";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadSavedDays(): SavedDay[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedDay[]) : [];
  } catch (error) {
    console.error("[storage] failed to load saved days", error);
    return [];
  }
}

export function saveSavedDay(day: SavedDay): SavedDay[] {
  if (!isBrowser()) return [];
  try {
    const next = [day, ...loadSavedDays()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("[storage] failed to save day", error);
    throw error;
  }
}

export function deleteSavedDay(id: string): SavedDay[] {
  if (!isBrowser()) return [];
  try {
    const next = loadSavedDays().filter((day) => day.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch (error) {
    console.error("[storage] failed to delete saved day", error);
    throw error;
  }
}
