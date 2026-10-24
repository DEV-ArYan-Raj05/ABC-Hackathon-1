import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';

interface CanFrame {
  id: string;
  name: string;
  dlc: number;
  data: string;
  frequency: string;
  status: 'NOMINAL' | 'ELEVATED' | 'ALERT';
}

export const CopilotAiView: React.FC = () => {
  const {
    state,
    applyCopilotStrategy,
    simulateAlternative,
    engageIntervention,
  } = useTelemetry();

  const [activeTab, setActiveTab] = useState<'envelope' | 'canbus' | 'advisor'>('envelope');
  const [selectedCanId, setSelectedCanId] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // CAN Frames
  const canFrames: CanFrame[] = [
    {
      id: '0x102',
      name: 'INVERTER_FL_TORQUE',
      dlc: 8,
      data: `[0x01, 0x7C, 0x00, 0x00, ${(state.powerKw > 100 ? '0xEF' : '0x44')}, 0x12, 0x88, 0x0A]`,
      frequency: '100 Hz',
      status: state.powerKw > 100 ? 'ELEVATED' : 'NOMINAL',
    },
    {
      id: '0x2A4',
      name: 'BMS_MODULE_THERM_M4',
      dlc: 8,
      data: `[0x04, 0x${Math.round(state.packTempC).toString(16).toUpperCase()}, 0x${Math.round(state.cells[28]?.temp || 46).toString(16).toUpperCase()}, 0x01, 0x99, 0x02, 0xAA, 0xFE]`,
      frequency: '20 Hz',
      status: state.packTempC > 40 ? 'ALERT' : 'NOMINAL',
    },
    {
      id: '0x3F2',
      name: 'CHASSIS_YAW_LIDAR_RADAR',
      dlc: 8,
      data: `[0x${Math.round(state.obstacleDistanceM).toString(16).toUpperCase()}, 0x12, 0x03, 0x00, 0x${Math.round(state.frictionMu * 100).toString(16).toUpperCase()}, 0x55, 0x11, 0x00]`,
      frequency: '50 Hz',
      status: state.obstacleDistanceM < 80 ? 'ALERT' : 'NOMINAL',
    },
    {
      id: '0x48B',
      name: 'GLYCOL_PUMP_ACTUATOR',
      dlc: 8,
      data: `[0x0E, 0x${Math.round(state.coolantDutyCyclePercent).toString(16).toUpperCase()}, 0x10, 0x68, 0x00, 0x00, 0x9A, 0x12]`,
      frequency: '10 Hz',
      status: 'NOMINAL',
    },
    {
      id: '0x7FE',
      name: 'SAFETY_ENVELOPE_STATUS',
      dlc: 8,
      data: `[0x${state.riskScore.toString(16).toUpperCase()}, 0x${Math.round(state.kalmanRecoveryPercent).toString(16).toUpperCase()}, 0x${(state.coPilotInterventionEngaged ? 1 : 0).toString(16).toUpperCase()}, 0x00, 0x11, 0x22, 0x33, 0x44]`,
      frequency: '2 Hz',
      status: state.riskScore > 60 ? 'ALERT' : 'NOMINAL',
    },
  ];

  const handleRunAiAnalysis = () => {
    setAiAnalysisRunning(true);
    setAnalysisResult(null);

    setTimeout(() => {
      setAiAnalysisRunning(false);
      const isIce = state.surfaceCondition === 'ice';
      const isHot = state.packTempC > 40;
      let text = `[DIAGNOSTIC ADVISORY REPORT :: TIMESTAMP ${Date.now()}]\n\n`;

      if (isIce && state.speedKmh > 90) {
        text += `• KINEMATIC DANGER: Vehicle velocity (${state.speedKmh} km/h) exceeds safe deceleration envelope on ${state.surfaceCondition.toUpperCase()} (μ=${state.frictionMu}). Stopping distance is ${state.realStoppingDistanceM}m vs obstacle distance of ${state.obstacleDistanceM}m.\n`;
      }
      if (isHot) {
        text += `• THERMAL DISSIPATION CEILING: Module 4 thermistor cluster has reached ${state.packTempC}°C (critical trip limit 45.0°C). Cell Δ spread is ${state.cellSpreadDeltaV}V. Power throttle derate of 18% is currently active.\n`;
      }
      text += `• DIGITAL TWIN MODEL VARIANCE: Twin predictor projects target optimal speed of ${state.recommendedSpeedKmh} km/h. Executing predictive ABS pulsing will restore stopping corridor to 41.0m, preventing forward impact.`;

      setAnalysisResult(text);
    }, 800);
  };

  const handleExportJson = () => {
    const fullLog = {
      export_timestamp: new Date().toISOString(),
      vehicle_id: 'EV-STG-X1-PROTOTYPE',
      state,
      can_bus_frames: canFrames,
    };
    const blob = new Blob([JSON.stringify(fullLog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ev_telemetry_dump_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredFrames = selectedCanId === 'all'
    ? canFrames
    : canFrames.filter(f => f.id === selectedCanId);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 gap-4">
      {/* Top Banner */}
      <div className="bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded bg-[#272a32] border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe]">
            <span className="material-symbols-outlined text-[22px]">terminal</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[10px] text-[#00f2fe] uppercase tracking-wider font-bold">
                COPILOT AI INTEL
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
            </div>
            <h2 className="font-headline-sm text-[18px] text-[#e1e2ec] tracking-tight">
              Safety Envelope &amp; CAN Bus Inspector
            </h2>
          </div>
        </div>

        <button
          onClick={handleExportJson}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#272a32] hover:bg-[#363941] text-[#00f2fe] border border-[#00f2fe]/30 font-label-caps text-[10px] uppercase transition-colors cursor-pointer active:scale-95 shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          <span>EXPORT DUMP</span>
        </button>
      </div>

      {/* View Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-[#0b0e15] border border-[#3a494b]/40 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('envelope')}
          className={`py-1.5 rounded font-label-caps text-[11px] uppercase transition-colors cursor-pointer text-center font-bold ${
            activeTab === 'envelope'
              ? 'bg-[#00f2fe] text-[#00373a] shadow-sm'
              : 'text-[#b9cacb] hover:text-[#e1e2ec]'
          }`}
        >
          Safety Envelope
        </button>
        <button
          onClick={() => setActiveTab('advisor')}
          className={`py-1.5 rounded font-label-caps text-[11px] uppercase transition-colors cursor-pointer text-center font-bold ${
            activeTab === 'advisor'
              ? 'bg-[#00f2fe] text-[#00373a] shadow-sm'
              : 'text-[#b9cacb] hover:text-[#e1e2ec]'
          }`}
        >
          AI Advisor &amp; Test
        </button>
        <button
          onClick={() => setActiveTab('canbus')}
          className={`py-1.5 rounded font-label-caps text-[11px] uppercase transition-colors cursor-pointer text-center font-bold ${
            activeTab === 'canbus'
              ? 'bg-[#00f2fe] text-[#00373a] shadow-sm'
              : 'text-[#b9cacb] hover:text-[#e1e2ec]'
          }`}
        >
          CAN Bus Frames
        </button>
      </div>

      {/* TAB 1: SAFETY ENVELOPE BOUNDS */}
      {activeTab === 'envelope' && (
        <div className="flex flex-col gap-4">
          {/* Key Margins */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Stopping Buffer Margin */}
            <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Stopping Buffer</span>
                <span
                  className={`font-label-caps text-[9px] font-bold ${
                    state.obstacleDistanceM > state.realStoppingDistanceM ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                  }`}
                >
                  {state.obstacleDistanceM > state.realStoppingDistanceM ? 'SAFE' : 'HAZARD'}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span
                    className={`font-telemetry-xl text-[28px] font-bold ${
                      state.obstacleDistanceM > state.realStoppingDistanceM ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                    }`}
                  >
                    {(state.obstacleDistanceM - state.realStoppingDistanceM).toFixed(1)}
                  </span>
                  <span className="font-label-caps text-[11px] text-[#b9cacb]">meters margin</span>
                </div>
                <div className="w-full bg-[#272a32] h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      state.obstacleDistanceM > state.realStoppingDistanceM ? 'bg-[#4edea3]' : 'bg-[#ffb4ab]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(10, ((state.obstacleDistanceM - state.realStoppingDistanceM) / 50) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 2. Thermal Headroom Margin */}
            <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Thermal Headroom</span>
                <span className="font-label-caps text-[9px] text-[#ffb95f] font-bold">45.0°C LIMIT</span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-telemetry-xl text-[28px] text-[#ffb95f] font-bold">
                    {Math.max(0, +(45.0 - state.packTempC).toFixed(1))}
                  </span>
                  <span className="font-label-caps text-[11px] text-[#b9cacb]">°C available margin</span>
                </div>
                <div className="w-full bg-[#272a32] h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-[#ffb95f] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(5, (state.packTempC / 45.0) * 100))}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 3. Traction Friction Margin */}
            <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Traction Grip (μ)</span>
                <span className="font-label-caps text-[9px] text-[#4edea3]">0.85 DRY BASE</span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-telemetry-xl text-[28px] text-[#e0fdff] font-bold">
                    {state.frictionMu}
                  </span>
                  <span className="font-label-caps text-[11px] text-[#b9cacb]">mu coefficient</span>
                </div>
                <p className="font-body-sm text-[10px] text-[#b9cacb] mt-1 leading-tight">
                  Tire slip threshold: {state.surfaceCondition === 'ice' ? 'Critical High Slip' : 'Within Linear Range'}
                </p>
              </div>
            </div>

            {/* 4. Regenerative Harvest Rate */}
            <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Harvest Capacity</span>
                <span className="font-label-caps text-[9px] text-[#00f2fe]">BMS ENVELOPE</span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="font-telemetry-xl text-[28px] text-[#4edea3] font-bold">
                    {Math.abs(state.regenKw)}
                  </span>
                  <span className="font-label-caps text-[11px] text-[#b9cacb]">kW dynamic recovery</span>
                </div>
                <p className="font-body-sm text-[10px] text-[#b9cacb] mt-1 leading-tight">
                  {state.frictionMu < 0.4
                    ? 'Limited by wheel slip differential'
                    : 'Full kinetic regeneration unconstrained'}
                </p>
              </div>
            </div>
          </div>

          {/* Intervention Controllers */}
          <div className="bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md flex flex-col gap-3">
            <span className="font-label-caps text-[11px] text-[#00f2fe] uppercase tracking-wider font-bold">
              Autonomous Copilot Mitigations
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={engageIntervention}
                className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  state.coPilotInterventionEngaged
                    ? 'bg-[#00a572]/20 border-[#4edea3] text-[#e1e2ec]'
                    : 'bg-[#1d1f27] border-[#3a494b]/40 text-[#b9cacb] hover:text-[#e1e2ec]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[22px] mt-0.5 ${
                    state.coPilotInterventionEngaged ? 'text-[#4edea3]' : 'text-[#849495]'
                  }`}
                >
                  {state.coPilotInterventionEngaged ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[11px] font-bold text-[#e1e2ec]">
                    Dynamic ABS Vectoring
                  </span>
                  <span className="font-body-sm text-[11px] text-[#b9cacb] mt-0.5">
                    Micro-pulse calipers @ 40Hz to recover traction on ice patches.
                  </span>
                </div>
              </button>

              <button
                onClick={applyCopilotStrategy}
                className="p-3 rounded-lg bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/40 text-left flex items-start gap-3 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px] text-[#00f2fe] mt-0.5">
                  speed
                </span>
                <div className="flex flex-col">
                  <span className="font-label-caps text-[11px] font-bold text-[#e1e2ec]">
                    Enforce Speed Cap (82 km/h)
                  </span>
                  <span className="font-body-sm text-[11px] text-[#b9cacb] mt-0.5">
                    Align throttle envelope with AI recommendation to preserve pack buffer.
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI ADVISOR & STRESS TEST */}
      {activeTab === 'advisor' && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[11px] text-[#00f2fe] uppercase tracking-wider font-bold">
                Automated Safety Scenario Analysis
              </span>
              <button
                onClick={handleRunAiAnalysis}
                disabled={aiAnalysisRunning}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00f2fe] hover:bg-[#6ff6ff] text-[#00373a] font-label-caps text-[10px] font-bold uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">psychology</span>
                <span>{aiAnalysisRunning ? 'Synthesizing...' : 'Evaluate Current State'}</span>
              </button>
            </div>

            <p className="font-body-sm text-[12px] text-[#b9cacb]">
              Runs rule-based kinematic synthesis cross-referencing thermal derate, road friction μ, obstacle
              distance, and 96-cell thermistor delta.
            </p>

            {analysisResult && (
              <div className="bg-[#0b0e15] border border-[#00f2fe]/40 rounded-lg p-3 font-telemetry-sm text-[12px] text-[#e0fdff] whitespace-pre-wrap leading-relaxed">
                {analysisResult}
              </div>
            )}

            {/* Quick Presets for Custom Test */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#3a494b]/20">
              <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">
                Quick Stress Scenario Injections
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    useTelemetry();
                    simulateAlternative();
                  }}
                  className="px-2.5 py-2 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 text-left cursor-pointer"
                >
                  <span className="font-label-caps text-[10px] text-[#ffb95f] block">Profile B Regen Bleed</span>
                  <span className="font-body-sm text-[10px] text-[#b9cacb]">Test inverter passive dissipation</span>
                </button>
                <button
                  onClick={() => applyCopilotStrategy()}
                  className="px-2.5 py-2 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 text-left cursor-pointer"
                >
                  <span className="font-label-caps text-[10px] text-[#4edea3] block">WLTP Speed Trim</span>
                  <span className="font-body-sm text-[10px] text-[#b9cacb]">Step down to 82 km/h</span>
                </button>
                <button
                  onClick={engageIntervention}
                  className="px-2.5 py-2 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 text-left cursor-pointer"
                >
                  <span className="font-label-caps text-[10px] text-[#00f2fe] block">ABS Vector Prime</span>
                  <span className="font-body-sm text-[10px] text-[#b9cacb]">Torque vectoring calibration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAN BUS STREAM */}
      {activeTab === 'canbus' && (
        <div className="flex flex-col gap-3">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-2 bg-[#191b23] border border-[#3a494b]/30 p-2 rounded-lg">
            <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Filter Frame ID:</span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {['all', '0x102', '0x2A4', '0x3F2', '0x48B', '0x7FE'].map(id => (
                <button
                  key={id}
                  onClick={() => setSelectedCanId(id)}
                  className={`px-2 py-0.5 rounded font-label-caps text-[10px] uppercase cursor-pointer transition-colors ${
                    selectedCanId === id
                      ? 'bg-[#00f2fe] text-[#00373a] font-bold'
                      : 'bg-[#0b0e15] text-[#b9cacb] hover:text-[#e1e2ec]'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Frames list */}
          <div className="flex flex-col gap-2">
            {filteredFrames.map(frame => (
              <div
                key={frame.id}
                className="bg-[#0b0e15] border border-[#3a494b]/30 rounded-lg p-3 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-telemetry-sm text-[13px] text-[#00f2fe] font-bold">
                      {frame.id}
                    </span>
                    <span className="font-label-caps text-[10px] text-[#e1e2ec]">
                      {frame.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-telemetry-sm text-[10px] text-[#b9cacb]">{frame.frequency}</span>
                    <span
                      className={`font-label-caps text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        frame.status === 'ALERT'
                          ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                          : frame.status === 'ELEVATED'
                          ? 'bg-[#ffd3a1]/20 text-[#ffb95f]'
                          : 'bg-[#00a572]/20 text-[#4edea3]'
                      }`}
                    >
                      {frame.status}
                    </span>
                  </div>
                </div>

                <div className="font-telemetry-sm text-[11px] text-[#6ff6ff] bg-[#10131a] p-2 rounded border border-[#3a494b]/20 overflow-x-auto no-scrollbar">
                  {frame.data}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
