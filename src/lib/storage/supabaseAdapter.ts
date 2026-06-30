import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  NewSavedDay,
  SavedDay,
  SavedDevice,
  StorageAdapter,
} from "./storageAdapter";

interface SavedDayRow {
  id: string;
  anon_id: string;
  saved_at: string;
  intensity_at_save: number;
  total_gco2eq: number;
  devices: SavedDevice[];
}

export function rowToSavedDay(row: SavedDayRow): SavedDay {
  return {
    id: row.id,
    anonId: row.anon_id,
    savedAt: row.saved_at,
    intensityAtSave: row.intensity_at_save,
    totalGco2eq: row.total_gco2eq,
    devices: row.devices,
  };
}

function createSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Implémentation Supabase de StorageAdapter. Passe systématiquement par des
 * fonctions RPC (jamais par .from().select()/.insert()/.delete() bruts) :
 * voir le commentaire dans supabase/schema.sql sur set_config + RLS.
 */
export class SupabaseAdapter implements StorageAdapter {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient = createSupabaseAdminClient()) {
    this.client = client;
  }

  async listDays(anonId: string): Promise<SavedDay[]> {
    const { data, error } = await this.client.rpc("list_saved_days", {
      p_anon_id: anonId,
    });
    if (error) {
      throw new Error(`SupabaseAdapter.listDays failed: ${error.message}`);
    }
    return (data as SavedDayRow[]).map(rowToSavedDay);
  }

  async saveDay(anonId: string, day: NewSavedDay): Promise<SavedDay> {
    const { data, error } = await this.client.rpc("insert_saved_day", {
      p_anon_id: anonId,
      p_intensity_at_save: day.intensityAtSave,
      p_total_gco2eq: day.totalGco2eq,
      p_devices: day.devices,
    });
    if (error) {
      throw new Error(`SupabaseAdapter.saveDay failed: ${error.message}`);
    }
    const [inserted] = data as SavedDayRow[];
    if (!inserted) {
      throw new Error("SupabaseAdapter.saveDay: insert returned no row");
    }
    return rowToSavedDay(inserted);
  }

  async deleteDay(anonId: string, id: string): Promise<void> {
    const { error } = await this.client.rpc("delete_saved_day", {
      p_anon_id: anonId,
      p_id: id,
    });
    if (error) {
      throw new Error(`SupabaseAdapter.deleteDay failed: ${error.message}`);
    }
  }
}

let singleton: SupabaseAdapter | undefined;

/**
 * Instance partagée, créée paresseusement au premier appel — jamais au
 * chargement du module, pour ne pas exiger les variables d'environnement
 * Supabase au moment du build (`next build` évalue les modules de route).
 */
export function getSupabaseAdapter(): SupabaseAdapter {
  if (!singleton) {
    singleton = new SupabaseAdapter();
  }
  return singleton;
}
