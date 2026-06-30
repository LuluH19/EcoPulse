import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToSavedDay, SupabaseAdapter } from "../supabaseAdapter";
import type { NewSavedDay } from "../storageAdapter";

const ROW = {
  id: "11111111-1111-1111-1111-111111111111",
  anon_id: "22222222-2222-2222-2222-222222222222",
  saved_at: "2026-06-30T10:00:00.000Z",
  intensity_at_save: 45,
  total_gco2eq: 93.24,
  devices: [
    {
      label: "Streaming 4K",
      kwhPerHour: 0.22,
      hours: 1,
      gco2eq: 9.9,
      custom: false,
    },
  ],
};

function mockClient(rpcImpl: (...args: unknown[]) => unknown): SupabaseClient {
  return { rpc: vi.fn(rpcImpl) } as unknown as SupabaseClient;
}

describe("rowToSavedDay", () => {
  it("maps snake_case DB columns to the camelCase SavedDay shape", () => {
    expect(rowToSavedDay(ROW)).toEqual({
      id: ROW.id,
      anonId: ROW.anon_id,
      savedAt: ROW.saved_at,
      intensityAtSave: ROW.intensity_at_save,
      totalGco2eq: ROW.total_gco2eq,
      devices: ROW.devices,
    });
  });
});

describe("SupabaseAdapter", () => {
  it("listDays calls list_saved_days and maps every row", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [ROW], error: null });
    const adapter = new SupabaseAdapter(mockClient(rpc));

    const days = await adapter.listDays(ROW.anon_id);

    expect(rpc).toHaveBeenCalledWith("list_saved_days", {
      p_anon_id: ROW.anon_id,
    });
    expect(days).toEqual([rowToSavedDay(ROW)]);
  });

  it("saveDay calls insert_saved_day with snake_case params and maps the result", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [ROW], error: null });
    const adapter = new SupabaseAdapter(mockClient(rpc));

    const newDay: NewSavedDay = {
      intensityAtSave: ROW.intensity_at_save,
      totalGco2eq: ROW.total_gco2eq,
      devices: ROW.devices,
    };

    const saved = await adapter.saveDay(ROW.anon_id, newDay);

    expect(rpc).toHaveBeenCalledWith("insert_saved_day", {
      p_anon_id: ROW.anon_id,
      p_intensity_at_save: newDay.intensityAtSave,
      p_total_gco2eq: newDay.totalGco2eq,
      p_devices: newDay.devices,
    });
    expect(saved).toEqual(rowToSavedDay(ROW));
  });

  it("deleteDay calls delete_saved_day with anonId and id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const adapter = new SupabaseAdapter(mockClient(rpc));

    await adapter.deleteDay(ROW.anon_id, ROW.id);

    expect(rpc).toHaveBeenCalledWith("delete_saved_day", {
      p_anon_id: ROW.anon_id,
      p_id: ROW.id,
    });
  });

  it("throws when the RPC call returns an error", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "boom" } });
    const adapter = new SupabaseAdapter(mockClient(rpc));

    await expect(adapter.listDays(ROW.anon_id)).rejects.toThrow(/boom/);
  });

  it("saveDay throws when the insert returns no row", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const adapter = new SupabaseAdapter(mockClient(rpc));

    await expect(
      adapter.saveDay(ROW.anon_id, {
        intensityAtSave: 1,
        totalGco2eq: 1,
        devices: [],
      })
    ).rejects.toThrow(/no row/);
  });
});
