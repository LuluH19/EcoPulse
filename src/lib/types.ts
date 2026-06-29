export interface CarbonIntensityPoint {
  /** ISO 8601 timestamp of the measurement */
  timestamp: string;
  /** Grid carbon intensity in gCO2eq per kWh */
  gCO2PerKWh: number;
}
