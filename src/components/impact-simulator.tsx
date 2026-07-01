"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeviceRow } from "@/components/device-row";
import { USAGE_PROFILES } from "@/config/usage-profiles";
import { CATALOG_KEYS, useImpactSimulator } from "@/hooks/useImpactSimulator";

interface ImpactSimulatorProps {
  currentIntensity: number;
  onSaved: () => void;
}

export function ImpactSimulator({
  currentIntensity,
  onSaved,
}: ImpactSimulatorProps) {
  const {
    catalogState,
    customDevices,
    isAdding,
    setIsAdding,
    newLabel,
    setNewLabel,
    newWatts,
    setNewWatts,
    addError,
    isSaving,
    saveError,
    activeEntries,
    total,
    toggleCatalog,
    setCatalogHours,
    toggleCustom,
    setCustomHours,
    removeCustom,
    handleAddDevice,
    handleSave,
  } = useImpactSimulator(currentIntensity, onSaved);

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {CATALOG_KEYS.map((key) => (
          <DeviceRow
            key={key}
            label={USAGE_PROFILES[key].label}
            active={catalogState[key].active}
            hours={catalogState[key].hours}
            onToggle={(active) => toggleCatalog(key, active)}
            onHoursChange={(hours) => setCatalogHours(key, hours)}
          />
        ))}

        {customDevices.map((device) => (
          <DeviceRow
            key={device.id}
            label={`${device.label} (${device.watts} W)`}
            active={device.active}
            hours={device.hours}
            onToggle={(active) => toggleCustom(device.id, active)}
            onHoursChange={(hours) => setCustomHours(device.id, hours)}
            onRemove={() => removeCustom(device.id)}
          />
        ))}
      </ul>

      {isAdding ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Nom de l'appareil"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            className="w-40"
          />
          <Input
            type="number"
            min="0"
            placeholder="Watts"
            value={newWatts}
            onChange={(event) => setNewWatts(event.target.value)}
            className="w-24"
          />
          <Button onClick={handleAddDevice}>Ajouter</Button>
          <Button variant="ghost" onClick={() => setIsAdding(false)}>
            Annuler
          </Button>
          {addError && (
            <p className="w-full text-sm text-destructive">{addError}</p>
          )}
        </div>
      ) : (
        <Button variant="outline" onClick={() => setIsAdding(true)}>
          Ajouter mon appareil
        </Button>
      )}

      <div className="rounded-md border p-3 text-sm">
        <p className="font-medium">
          Empreinte totale : {Math.round(total.gco2eq)} gCO₂eq (
          {total.kgco2eq.toFixed(2)} kg) — équivalent{" "}
          {total.carKmEquiv.toFixed(1)} km en voiture
        </p>
      </div>

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}

      <Button
        onClick={handleSave}
        disabled={activeEntries.length === 0 || isSaving}
      >
        {isSaving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );
}
