"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DURATION_SLIDER_BOUNDS } from "@/config/duration-slider";

interface DeviceRowProps {
  label: string;
  active: boolean;
  hours: number;
  onToggle: (active: boolean) => void;
  onHoursChange: (hours: number) => void;
  onRemove?: () => void;
}

export function DeviceRow({
  label,
  active,
  hours,
  onToggle,
  onHoursChange,
  onRemove,
}: DeviceRowProps) {
  return (
    <li className="flex flex-col gap-2">
      <label className="flex items-center gap-2">
        <Checkbox
          checked={active}
          onCheckedChange={(checked) => onToggle(checked === true)}
        />
        <span>{label}</span>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            Retirer
          </Button>
        )}
      </label>
      {active && (
        <div className="flex items-center gap-3 pl-6">
          <Slider
            className="max-w-xs"
            value={[hours]}
            min={DURATION_SLIDER_BOUNDS.min}
            max={DURATION_SLIDER_BOUNDS.max}
            step={DURATION_SLIDER_BOUNDS.step}
            onValueChange={([value]) => onHoursChange(value)}
          />
          <span className="text-sm text-muted-foreground">{hours} h</span>
        </div>
      )}
    </li>
  );
}
