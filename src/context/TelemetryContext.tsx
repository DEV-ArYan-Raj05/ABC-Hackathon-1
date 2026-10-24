import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  TelemetryState,
  RoadSurface,
  SimulationSpeed,
  PresetType,
  TabType,
  BatteryCell,
  ActivePerturbation,
  TimelineEvent,
  RollingDataPoint,
} from '../types/telemetry';

// Generate 96 cells in 12x8 layout
export function generateInitialCells(): BatteryCell[] {
  const cells: BatteryCell[] = [];
  let id = 1;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 12; c++) {
      // Determine module (Modules 1 to 8 across 96 cells)
      const module = Math.floor(c / 3) + Math.floor(r / 4) * 4 + 1;
      
      // Module 4 Hotspot cluster around row 2-3, col 4-7
      let temp = 37.8 + Math.random() * 0.8;
      let isHotspot = false;

      if (r === 1 && (c === 5 || c === 6)) {
        temp = 41.5 + Math.random() * 0.5;
      } else if (r === 2 && (c === 4 || c === 5 || c === 6 || c === 7)) {
        if (c === 4 || c === 5) {
          temp = 46.2;
          isHotspot = true;
        } else {
          temp = 42.4 + Math.random() * 0.5;
        }
      } else if (r === 3 && (c === 3 || c === 4 || c === 5 || c === 6)) {
        if (c === 4) {
          temp = 45.8;
          isHotspot = true;
        } else {
          temp = 42.1 + Math.random() * 0.5;
        }
      } else if (r === 4 && c === 4) {
        temp = 41.2;
      }

      // Voltages nominal ~3.821 to 3.845 V
      const voltage = +(3.821 + Math.random() * 0.024).toFixed(3);
      const internalResistance = +(1.12 + (temp > 44 ? 0.35 : 0.05)).toFixed(2);

      cells.push({
        id,
        row: r,
        col: c,
        module,
        temp: +temp.toFixed(1),
        voltage,
        internalResistance,
        isHotspot,
        balanceActive: isHotspot,
      });

      id++;
    }
  }

  return cells;
}

// Initial 60s dynamic vector history
function generateInitialRollingHistory(): RollingDataPoint[] {
  const points: RollingDataPoint[] = [];
  const count = 30;
  for (let i = 0; i <= count; i++) {
    const timeSec = -60 + (i / count) * 60;
    // fluctuating wave matching HUD mock
    const sin1 = Math.sin((i / count) * Math.PI * 4);
    const powerKw = Math.round(sin1 > 0 ? sin1 * 260 + 26 : sin1 * 42);
    const efficiencyWhKm = Math.round(160 + (i / count) * 58 + Math.random() * 5);
    const temperatureC = +(28 + (i / count) * 14.8 + Math.random() * 0.4).toFixed(1);
    const socPercent = +(64.8 - (i / count) * 0.6).toFixed(1);

    points.push({
      timeSec: Math.round(timeSec),
      powerKw,
      efficiencyWhKm,
      temperatureC,
      socPercent,
    });
  }
  return points;
}

interface TelemetryContextType {
  state: TelemetryState;
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  selectedCell: BatteryCell | null;
  setSelectedCell: (cell: BatteryCell | null) => void;
  isCellMatrixModalOpen: boolean;
  setIsCellMatrixModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  setSpeed: (v: number) => void;
  setPackTemp: (t: number) => void;
  setObstacleDistance: (d: number) => void;
  setAmbientTemp: (t: number) => void;
  setSurfaceCondition: (surface: RoadSurface) => void;
  togglePlay: () => void;
  setMultiplier: (speed: SimulationSpeed) => void;
  setPreset: (preset: PresetType) => void;
  setMode: (mode: 'MANUAL' | 'SCENARIO') => void;
  setScenario: (scenario: string) => void;
  triggerFault: (name: string, type: ActivePerturbation['type']) => void;
  clearAllFaults: () => void;
  triggerCocktail: () => void;
  applyCopilotStrategy: () => void;
  simulateAlternative: () => void;
  engageIntervention: () => void;
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<TabType>('hud-vehicle-stage');
  const [selectedCell, setSelectedCell] = useState<BatteryCell | null>(null);
  const [isCellMatrixModalOpen, setIsCellMatrixModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [state, setState] = useState<TelemetryState>(() => ({
    mode: 'SCENARIO',
    scenario: 'alpine',
    isPlaying: true,
    multiplier: 1,
    preset: 'ALPHA_WLTP',
    tickCount: 0,

    speedKmh: 114,
    recommendedSpeedKmh: 82,
    altitudeM: 0.42,
    thrustKw: 48,
    powerKw: 68.4,
    regenKw: -42,
    peakPowerKw: 286,
    surfaceCondition: 'ice',
    frictionMu: 0.32,
    obstacleDistanceM: 72.4,
    ambientTempC: -4,
    timeToCollisionS: 2.33,
    realStoppingDistanceM: 64.0,
    twinStoppingDistanceM: 41.0,
    twinAdvanceM: 8.2,
    twinDeltaSpeedKmh: -18,

    packSocPercent: 64.2,
    packTempC: 42.8,
    packStrainIndex: 74,
    strainRatePerMin: 3.8,
    powerLimitPercent: 82,
    cRateInstant: 2.41,
    cRateMax: 2.80,
    cellSpreadDeltaV: 0.024,
    minCellVoltage: 3.821,
    maxCellVoltage: 3.845,
    coolantFlowLMin: 14.2,
    coolantDutyCyclePercent: 90,
    pumpRpm: 4200,
    heatPumpMode: 'Active Chilling',
    bmsHealthStatus: 'Nominal*',
    bmsAlertCount: 1,

    coPilotInterventionEngaged: false,
    kalmanRecoveryPercent: 78,
    riskScore: 68,
    riskGrade: 'CAUTION_AMBER',

    activeFaults: [
      {
        id: 'flt-cool',
        name: 'Cooling Failure',
        type: 'critical',
        label: 'COOLING FAIL',
        detail: 'Pump Cavitation (00:34)',
        timeRemaining: 34,
      },
      {
        id: 'flt-ice',
        name: 'Black Ice',
        type: 'friction',
        label: 'BLACK ICE',
        detail: 'Persistent μ=0.18',
        persistent: true,
      },
      {
        id: 'flt-latent',
        name: 'Latent Thermal Offset',
        type: 'temp',
        label: '+1 LATENT PERT',
        detail: 'Sub-surface heat bloom',
        persistent: true,
      },
    ],

    timelineEvents: [
      {
        id: 'ev-1',
        timestamp: '14:02:18.42',
        severity: 'CRITICAL',
        title: 'Thermal runaway risk in Module 4 (+46.2°C)',
        description: 'Throttling power output ceiling to 80 kW. Thermal derate active (-18%).',
      },
      {
        id: 'ev-2',
        timestamp: '14:02:15.10',
        severity: 'CAUTION',
        title: 'Traction loss detected on rear axle slip differential',
        description: 'Regenerative braking limited to 15%. Friction μ reduced to 0.32.',
      },
      {
        id: 'ev-3',
        timestamp: '14:01:50.88',
        severity: 'RESOLVED',
        title: 'Sensor dropout auto-compensated',
        description: 'Sensor dropout auto-compensated via Kalman filter digital-twin estimation matrix.',
      },
    ],

    cells: generateInitialCells(),
    rollingHistory: generateInitialRollingHistory(),
  }));

  // Physics & Telemetry update tick
  useEffect(() => {
    if (!state.isPlaying) return;

    const intervalMs = Math.max(80, 500 / state.multiplier);

    const timer = setInterval(() => {
      setState(prev => {
        const nextTick = prev.tickCount + 1;

        // Altitude oscillation: 0.40 to 0.45m
        const altPhase = (nextTick % 8) / 8;
        const altOffset = Math.sin(altPhase * Math.PI * 2) * 0.025;
        const newAltitude = +(0.425 + altOffset).toFixed(2);

        // Small random noise to live telemetry readings to make UI feel alive
        const noiseDist = +(prev.obstacleDistanceM + (Math.random() * 0.2 - 0.1)).toFixed(1);
        const noiseTTC = +(noiseDist / Math.max(10, prev.speedKmh * 0.2777)).toFixed(2);

        // Stopping distance formulas based on speed & friction
        const realStop = +((prev.speedKmh * prev.speedKmh) / (254 * Math.max(0.1, prev.frictionMu))).toFixed(1);
        const twinStop = +(realStop * 0.64).toFixed(1);

        // Update cooling countdown
        const updatedFaults = prev.activeFaults.map(f => {
          if (f.timeRemaining !== undefined && f.timeRemaining > 0) {
            return { ...f, timeRemaining: Math.max(0, f.timeRemaining - 1) };
          }
          return f;
        });

        // Compute risk score dynamically
        let computedRisk = Math.min(100, Math.round(
          25 + 
          (prev.speedKmh / 3.2) + 
          (prev.packTempC > 38 ? (prev.packTempC - 38) * 3 : 0) +
          (prev.frictionMu < 0.4 ? (0.4 - prev.frictionMu) * 60 : 0)
        ));
        if (prev.coPilotInterventionEngaged) {
          computedRisk = Math.max(20, computedRisk - 25);
        }

        const riskGrade = computedRisk > 75 ? 'CRITICAL_RED' : computedRisk > 50 ? 'CAUTION_AMBER' : 'NOMINAL';

        // Update rolling history slightly
        const newPoint: RollingDataPoint = {
          timeSec: 0,
          powerKw: Math.round(prev.powerKw + (Math.random() * 6 - 3)),
          efficiencyWhKm: Math.round(218 + (Math.random() * 4 - 2)),
          temperatureC: prev.packTempC,
          socPercent: +(prev.packSocPercent - 0.002 * prev.multiplier).toFixed(2),
        };

        const updatedHistory = [...prev.rollingHistory.slice(1), newPoint];

        return {
          ...prev,
          tickCount: nextTick,
          altitudeM: newAltitude,
          obstacleDistanceM: noiseDist,
          timeToCollisionS: Math.max(0.5, noiseTTC),
          realStoppingDistanceM: realStop,
          twinStoppingDistanceM: twinStop,
          riskScore: computedRisk,
          riskGrade,
          activeFaults: updatedFaults,
          rollingHistory: updatedHistory,
        };
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [state.isPlaying, state.multiplier]);

  // Setters
  const setSpeed = useCallback((v: number) => {
    setState(prev => ({
      ...prev,
      speedKmh: v,
      powerKw: +(30 + (v * 0.55)).toFixed(1),
    }));
  }, []);

  const setPackTemp = useCallback((t: number) => {
    setState(prev => {
      // update cells in Module 4 accordingly
      const newCells = prev.cells.map(c => {
        if (c.isHotspot) {
          return { ...c, temp: +(t + 3.4).toFixed(1) };
        }
        return { ...c, temp: +(t - 3.8 + Math.random() * 0.8).toFixed(1) };
      });

      return {
        ...prev,
        packTempC: t,
        cells: newCells,
        packStrainIndex: Math.min(99, Math.round(40 + t * 0.8)),
      };
    });
  }, []);

  const setObstacleDistance = useCallback((d: number) => {
    setState(prev => ({
      ...prev,
      obstacleDistanceM: d,
      timeToCollisionS: +(d / Math.max(10, prev.speedKmh * 0.2777)).toFixed(2),
    }));
  }, []);

  const setAmbientTemp = useCallback((t: number) => {
    setState(prev => ({ ...prev, ambientTempC: t }));
  }, []);

  const setSurfaceCondition = useCallback((surface: RoadSurface) => {
    const muMap: Record<RoadSurface, number> = {
      dry: 0.85,
      wet: 0.55,
      snow: 0.35,
      ice: 0.18,
    };
    setState(prev => ({
      ...prev,
      surfaceCondition: surface,
      frictionMu: muMap[surface],
    }));
  }, []);

  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const setMultiplier = useCallback((m: SimulationSpeed) => {
    setState(prev => ({ ...prev, multiplier: m }));
  }, []);

  const setPreset = useCallback((preset: PresetType) => {
    setState(prev => {
      if (preset === 'ALPHA_WLTP') {
        return {
          ...prev,
          preset,
          speedKmh: 114,
          packTempC: 42.8,
          surfaceCondition: 'ice',
          frictionMu: 0.32,
          ambientTempC: -4,
        };
      } else if (preset === 'EXTREME_ALPINE') {
        return {
          ...prev,
          preset,
          speedKmh: 95,
          packTempC: 34.0,
          surfaceCondition: 'ice',
          frictionMu: 0.15,
          ambientTempC: -22,
        };
      } else if (preset === 'DESERT_TEST') {
        return {
          ...prev,
          preset,
          speedKmh: 130,
          packTempC: 48.5,
          surfaceCondition: 'dry',
          frictionMu: 0.88,
          ambientTempC: 46,
        };
      } else {
        return {
          ...prev,
          preset,
          speedKmh: 165,
          packTempC: 45.2,
          surfaceCondition: 'wet',
          frictionMu: 0.52,
          ambientTempC: 18,
        };
      }
    });
  }, []);

  const setMode = useCallback((mode: 'MANUAL' | 'SCENARIO') => {
    setState(prev => ({ ...prev, mode }));
  }, []);

  const setScenario = useCallback((scenario: string) => {
    setState(prev => {
      let speed = prev.speedKmh;
      let temp = prev.packTempC;
      let amb = prev.ambientTempC;
      let surface: RoadSurface = prev.surfaceCondition;

      if (scenario === 'alpine') {
        speed = 114;
        temp = 42.8;
        amb = -4;
        surface = 'ice';
      } else if (scenario === 'runaway') {
        speed = 140;
        temp = 51.2;
        amb = 42;
        surface = 'dry';
      } else if (scenario === 'urban') {
        speed = 45;
        temp = 36.4;
        amb = 22;
        surface = 'wet';
      } else if (scenario === 'hypermile') {
        speed = 88;
        temp = 32.1;
        amb = 15;
        surface = 'dry';
      }

      return {
        ...prev,
        scenario,
        speedKmh: speed,
        packTempC: temp,
        ambientTempC: amb,
        surfaceCondition: surface,
      };
    });
  }, []);

  // Fault triggers
  const triggerFault = useCallback((name: string, type: ActivePerturbation['type']) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');

    setState(prev => {
      const newFault: ActivePerturbation = {
        id: 'flt-' + Date.now(),
        name,
        type,
        label: name.toUpperCase(),
        detail: `Perturbation injected @ ${timeStr}`,
        timeRemaining: 45,
      };

      const newEvent: TimelineEvent = {
        id: 'ev-' + Date.now(),
        timestamp: timeStr,
        severity: type === 'critical' ? 'CRITICAL' : type === 'friction' ? 'CAUTION' : 'INJECTED',
        title: `${name} Injected into Bus`,
        description: `Dynamic perturbation applied: ${name}. Modulating closed-loop PID control envelope.`,
      };

      // Alter telemetry values based on fault
      let updatedTemp = prev.packTempC;
      let updatedMu = prev.frictionMu;
      let updatedSurface = prev.surfaceCondition;

      if (type === 'critical' || name.includes('Heat Wave')) {
        updatedTemp = Math.min(68, prev.packTempC + 4.2);
      } else if (name.includes('Cold Snap')) {
        updatedTemp = Math.max(-10, prev.packTempC - 8.5);
      } else if (name.includes('Black Ice')) {
        updatedMu = 0.15;
        updatedSurface = 'ice';
      }

      return {
        ...prev,
        activeFaults: [newFault, ...prev.activeFaults],
        timelineEvents: [newEvent, ...prev.timelineEvents],
        packTempC: updatedTemp,
        frictionMu: updatedMu,
        surfaceCondition: updatedSurface,
        kalmanRecoveryPercent: Math.max(45, prev.kalmanRecoveryPercent - 16),
      };
    });
  }, []);

  const clearAllFaults = useCallback(() => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');

    setState(prev => ({
      ...prev,
      activeFaults: [],
      kalmanRecoveryPercent: 100,
      timelineEvents: [
        {
          id: 'ev-' + Date.now(),
          timestamp: timeStr,
          severity: 'RESOLVED',
          title: 'All Perturbations Flushed & Reset',
          description: 'Kalman filter baseline restored. Battery strain vector nominal.',
        },
        ...prev.timelineEvents,
      ],
      packTempC: 38.2,
      frictionMu: 0.85,
      surfaceCondition: 'dry',
    }));
  }, []);

  const triggerCocktail = useCallback(() => {
    triggerFault('Regen Failure', 'inverter');
    setTimeout(() => triggerFault('Black Ice', 'friction'), 300);
    setTimeout(() => triggerFault('HVAC Surge', 'drain'), 600);
  }, [triggerFault]);

  const applyCopilotStrategy = useCallback(() => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');

    setState(prev => ({
      ...prev,
      speedKmh: 82,
      recommendedSpeedKmh: 82,
      packTempC: Math.max(36, prev.packTempC - 3.5),
      kalmanRecoveryPercent: 94,
      coPilotInterventionEngaged: true,
      timelineEvents: [
        {
          id: 'ev-' + Date.now(),
          timestamp: timeStr,
          severity: 'RESOLVED',
          title: 'AI Mitigation Strategy Applied',
          description: 'Target speed capped to 82 km/h. Glycol loop pumped to 100% duty cycle. Thermal ceiling protected.',
        },
        ...prev.timelineEvents,
      ],
    }));
  }, []);

  const simulateAlternative = useCallback(() => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + Math.floor(now.getMilliseconds() / 10).toString().padStart(2, '0');

    setState(prev => ({
      ...prev,
      timelineEvents: [
        {
          id: 'ev-' + Date.now(),
          timestamp: timeStr,
          severity: 'CAUTION',
          title: 'Simulating Alternative Profile B',
          description: 'Regenerative Brake Pre-load with Inverter Passive Bleed. Estimated stopping recovery: 6.8m.',
        },
        ...prev.timelineEvents,
      ],
    }));
  }, []);

  const engageIntervention = useCallback(() => {
    setState(prev => ({
      ...prev,
      coPilotInterventionEngaged: !prev.coPilotInterventionEngaged,
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      currentTab,
      setCurrentTab,
      selectedCell,
      setSelectedCell,
      isCellMatrixModalOpen,
      setIsCellMatrixModalOpen,
      isProfileModalOpen,
      setIsProfileModalOpen,
      setSpeed,
      setPackTemp,
      setObstacleDistance,
      setAmbientTemp,
      setSurfaceCondition,
      togglePlay,
      setMultiplier,
      setPreset,
      setMode,
      setScenario,
      triggerFault,
      clearAllFaults,
      triggerCocktail,
      applyCopilotStrategy,
      simulateAlternative,
      engageIntervention,
    }),
    [
      state,
      currentTab,
      selectedCell,
      isCellMatrixModalOpen,
      isProfileModalOpen,
      setSpeed,
      setPackTemp,
      setObstacleDistance,
      setAmbientTemp,
      setSurfaceCondition,
      togglePlay,
      setMultiplier,
      setPreset,
      setMode,
      setScenario,
      triggerFault,
      clearAllFaults,
      triggerCocktail,
      applyCopilotStrategy,
      simulateAlternative,
      engageIntervention,
    ]
  );

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
};

export function useTelemetry(): TelemetryContextType {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
