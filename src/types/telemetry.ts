export type RoadSurface = 'dry' | 'wet' | 'snow' | 'ice';

export type SimulationSpeed = 1 | 4 | 10;

export type PresetType = 'ALPHA_WLTP' | 'EXTREME_ALPINE' | 'DESERT_TEST' | 'NURBURGRING_LAP';

export type TabType = 'hud-vehicle-stage' | 'battery-strain-telemetry' | 'digital-twin-radar' | 'chaos-injection-alerts' | 'copilot-ai-json-inspector';

export interface BatteryCell {
  id: number;
  row: number;
  col: number;
  module: number;
  temp: number; // in Celsius
  voltage: number; // in Volts (e.g. 3.821 to 3.845)
  internalResistance: number; // in mOhm
  isHotspot: boolean;
  balanceActive: boolean;
}

export interface ActivePerturbation {
  id: string;
  name: string;
  type: 'temp' | 'friction' | 'lidar' | 'critical' | 'bms' | 'bus' | 'inverter' | 'drain';
  label: string;
  detail: string;
  timeRemaining?: number; // seconds remaining
  persistent?: boolean;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'CAUTION' | 'RESOLVED' | 'INJECTED';
  title: string;
  description: string;
  source?: string;
}

export interface RollingDataPoint {
  timeSec: number; // -60 to 0
  powerKw: number; // -50 to +300 kW
  efficiencyWhKm: number; // e.g. 150 to 240
  temperatureC: number; // e.g. 28 to 44
  socPercent: number; // e.g. 64.2 down
}

export interface TelemetryState {
  // Mode & Simulation
  mode: 'MANUAL' | 'SCENARIO';
  scenario: string;
  isPlaying: boolean;
  multiplier: SimulationSpeed;
  preset: PresetType;
  tickCount: number;

  // Vehicle Dynamics
  speedKmh: number;
  recommendedSpeedKmh: number;
  altitudeM: number;
  thrustKw: number;
  powerKw: number;
  regenKw: number;
  peakPowerKw: number;
  surfaceCondition: RoadSurface;
  frictionMu: number;
  obstacleDistanceM: number;
  ambientTempC: number;
  timeToCollisionS: number;
  realStoppingDistanceM: number;
  twinStoppingDistanceM: number;
  twinAdvanceM: number;
  twinDeltaSpeedKmh: number;

  // Battery Pack Telemetry
  packSocPercent: number;
  packTempC: number;
  packStrainIndex: number; // 0 to 100
  strainRatePerMin: number;
  powerLimitPercent: number;
  cRateInstant: number;
  cRateMax: number;
  cellSpreadDeltaV: number;
  minCellVoltage: number;
  maxCellVoltage: number;
  coolantFlowLMin: number;
  coolantDutyCyclePercent: number;
  pumpRpm: number;
  heatPumpMode: string;
  bmsHealthStatus: string;
  bmsAlertCount: number;

  // Digital Twin & Copilot
  coPilotInterventionEngaged: boolean;
  kalmanRecoveryPercent: number;
  riskScore: number; // 0 to 100
  riskGrade: 'NOMINAL' | 'CAUTION_AMBER' | 'CRITICAL_RED';

  // Active Faults & Event Stream
  activeFaults: ActivePerturbation[];
  timelineEvents: TimelineEvent[];

  // 96-Cell Pack Matrix
  cells: BatteryCell[];

  // Rolling vectors
  rollingHistory: RollingDataPoint[];
}
