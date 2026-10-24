import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { BatteryCell } from '../types/telemetry';

export const BatteryStrainView: React.FC = () => {
  const {
    state,
    setSelectedCell,
    setIsCellMatrixModalOpen,
  } = useTelemetry();

  const [isStreamPaused, setIsStreamPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamic values
  const strainVal = state.packStrainIndex;
  // Circumference for r=48: 2 * PI * 48 = 301.6
  // offset 0 is 100%, 301.6 is 0%
  const strainOffset = 301.6 - (strainVal / 100) * 301.6 * 0.75; // 75% arc span

  const bmsPayload = {
    timestamp_epoch_ms: Date.now(),
    battery_pack_id: 'HV-96S-400V-ALPHA',
    pack_strain_index: +(strainVal / 100).toFixed(4),
    thermal_derate_percent: state.packTempC > 40 ? 18.0 : 0.0,
    c_rate: {
      instant: state.cRateInstant,
      max_safety_limit: state.cRateMax,
    },
    battery_temp_c: {
      pack_mean: state.packTempC,
      min_cell: 37.8,
      max_cell: +(state.packTempC + 3.4).toFixed(1),
      hotspot_module: 4,
    },
    cell_voltages_min_max: [state.minCellVoltage, state.maxCellVoltage],
    coolant_loop: {
      flow_l_per_min: state.coolantFlowLMin,
      duty_cycle: +(state.coolantDutyCyclePercent / 100).toFixed(2),
      rpm: state.pumpRpm,
    },
  };

  const handleCellClick = (cell: BatteryCell) => {
    setSelectedCell(cell);
    setIsCellMatrixModalOpen(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(bmsPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 gap-4">
      {/* TOP TELEMETRY STATUS BAR */}
      <div className="flex items-center justify-between bg-[#191b23] border border-[#3a494b]/30 px-3 py-1.5 rounded-xl shadow-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-[#ffb95f] animate-ping shrink-0"></span>
          <span className="font-label-caps text-[11px] text-[#ffb95f] truncate">
            // PACK_BMS_TELEMETRY :: BUS_CAN_01
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-0.5 rounded bg-[#1d1f27] font-label-caps text-[10px] text-[#b9cacb] border border-[#3a494b]/30">
            BUF: 60s @ 10Hz
          </span>
          <span className="px-2 py-0.5 rounded bg-[#272a32] font-label-caps text-[10px] text-[#4edea3] border border-[#4edea3]/30">
            ACTIVE SYNC
          </span>
        </div>
      </div>

      {/* SECTION 1: MASTER PACK STRAIN INDEX HUD CARD */}
      <div className="bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-xl relative overflow-hidden flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#3a494b]/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">electric_meter</span>
            <span className="font-label-caps text-[11px] text-[#e1e2ec] tracking-wider uppercase">
              Master Pack Strain Index
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-[#ffd3a1]/20 text-[#ffb95f] font-label-caps text-[10px] uppercase border border-[#ffb95f]/30 font-bold">
            CAUTION AMBER
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-1">
          {/* Arc Meter SVG */}
          <div className="relative flex items-center justify-center shrink-0 w-44 h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              {/* Background track */}
              <circle
                className="text-[#272a32]"
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="301.6"
                strokeDashoffset="60.3"
                strokeLinecap="round"
              />
              {/* Active Strain Arc */}
              <circle
                className="text-[#ffb95f] transition-all duration-500"
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="301.6"
                strokeDashoffset={strainOffset}
                strokeLinecap="round"
              />
              {/* Nominal Range Guide */}
              <circle
                className="text-[#00f2fe]"
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="301.6"
                strokeDashoffset="240"
                strokeLinecap="round"
                opacity="0.3"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-telemetry-xl text-[36px] text-[#ffb95f] tracking-tighter leading-none">
                {strainVal}
                <span className="text-base text-[#b9cacb] font-telemetry-sm">%</span>
              </span>
              <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase tracking-widest mt-1">
                PACK STRAIN
              </span>
              <span className="font-body-sm text-[10px] text-[#ffb95f] mt-0.5 flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                +{state.strainRatePerMin}%/min
              </span>
            </div>
          </div>

          {/* Strain Diagnostic Breakdown (4 Cards) */}
          <div className="grid grid-cols-2 gap-2 w-full">
            {/* Power limit */}
            <div className="bg-[#1d1f27] border border-[#3a494b]/30 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Power Limit</span>
                <span className="material-symbols-outlined text-[#ffb95f] text-[14px]">thermostat</span>
              </div>
              <div className="mt-1">
                <span className="font-telemetry-md text-[18px] text-[#e1e2ec]">
                  {state.powerLimitPercent}
                  <span className="text-xs text-[#b9cacb] font-telemetry-sm">%</span>
                </span>
                <p className="font-body-sm text-[10px] text-[#b9cacb] mt-0.5 leading-tight">
                  Thermal derate active (-18%)
                </p>
              </div>
            </div>

            {/* Peak C-Rate */}
            <div className="bg-[#1d1f27] border border-[#3a494b]/30 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Peak C-Rate</span>
                <span className="font-label-caps text-[9px] text-[#ffb4ab]">MAX {state.cRateMax}C</span>
              </div>
              <div className="mt-1">
                <span className="font-telemetry-md text-[18px] text-[#00f2fe]">
                  {state.cRateInstant}
                  <span className="text-xs text-[#b9cacb] font-telemetry-sm">C</span>
                </span>
                <div className="w-full bg-[#32353d] h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-[#00f2fe] h-full rounded-full transition-all duration-300"
                    style={{ width: `${(state.cRateInstant / state.cRateMax) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* State of Charge */}
            <div className="bg-[#1d1f27] border border-[#3a494b]/30 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">State of Charge</span>
                <span className="material-symbols-outlined text-[#4edea3] text-[14px]">
                  battery_horiz_075
                </span>
              </div>
              <div className="mt-1">
                <span className="font-telemetry-md text-[18px] text-[#4edea3]">
                  {state.packSocPercent}
                  <span className="text-xs text-[#b9cacb] font-telemetry-sm">%</span>
                </span>
                <p className="font-body-sm text-[10px] text-[#b9cacb] mt-0.5 leading-tight">
                  Est. 342 km buffer
                </p>
              </div>
            </div>

            {/* Delta Spread */}
            <div className="bg-[#1d1f27] border border-[#3a494b]/30 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Cell Δ Spread</span>
                <span className="font-label-caps text-[9px] text-[#4edea3]">NOMINAL</span>
              </div>
              <div className="mt-1">
                <span className="font-telemetry-md text-[18px] text-[#e1e2ec]">
                  {state.cellSpreadDeltaV}
                  <span className="text-xs text-[#b9cacb] font-telemetry-sm">V</span>
                </span>
                <p className="font-body-sm text-[10px] text-[#b9cacb] mt-0.5 leading-tight">
                  Min {state.minCellVoltage} / Max {state.maxCellVoltage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ROLLING 60S TELEMETRY CHARTS (4-PANE HUD VISUALIZATION) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00f2fe] text-[18px]">show_chart</span>
            <span className="font-headline-sm text-[16px] text-[#e1e2ec]">Rolling 60s Dynamic Vectors</span>
          </div>
          <span className="font-label-caps text-[10px] text-[#b9cacb]">T-MINUS 60s → LIVE</span>
        </div>

        {/* Chart 1: Power (kW) with Regen Underflow Glow */}
        <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow-md flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe]"></span>
              <span className="font-label-caps text-[11px] text-[#e1e2ec] uppercase">
                Instantaneous Power (kW)
              </span>
            </div>
            <div className="flex items-center gap-2 font-telemetry-sm text-[12px]">
              <span className="text-[#4edea3]">{state.regenKw} kW (Regen)</span>
              <span className="text-[#00f2fe] font-bold">+{state.peakPowerKw} kW (Peak)</span>
            </div>
          </div>

          {/* Vector SVG Stream */}
          <div className="relative w-full h-28 bg-[#0b0e15] border border-[#3a494b]/30 rounded-lg overflow-hidden flex items-center justify-center p-1">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 320 80">
              <defs>
                <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.3" />
                  <stop offset="65%" stopColor="#00f2fe" stopOpacity="0.0" />
                  <stop offset="100%" stopColor="#4edea3" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Zero Line Grid Indicator */}
              <line x1="0" y1="52" x2="320" y2="52" stroke="#32353d" strokeWidth="1" strokeDasharray="2 2" />
              <text x="6" y="50" fill="#849495" fontFamily="JetBrains Mono" fontSize="7">
                0 kW (REST/FLOAT)
              </text>

              {/* Area fill with Regen floor */}
              <polygon
                fill="url(#powerGrad)"
                points="0,52 10,48 24,52 40,30 55,22 72,40 90,52 110,68 125,72 140,52 165,24 185,14 205,34 225,52 245,66 260,52 280,20 300,16 320,38 320,52"
              />

              {/* Main fluctuating path */}
              <path
                d="M0,52 L10,48 L24,52 L40,30 L55,22 L72,40 L90,52 L110,68 L125,72 L140,52 L165,24 L185,14 L205,34 L225,52 L245,66 L260,52 L280,20 L300,16 L320,38"
                fill="none"
                stroke="#00f2fe"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Live Telemetry Pinhole */}
              <circle cx="320" cy="38" r="3.5" fill="#00f2fe" className="animate-ping" />
              <circle cx="320" cy="38" r="2.5" fill="#e0fdff" />
            </svg>
          </div>

          <div className="flex items-center justify-between font-label-caps text-[9px] text-[#b9cacb] px-1">
            <span>-60 SEC</span>
            <span>-30 SEC</span>
            <span className="text-[#4edea3] font-bold">▼ REGEN BRAKING PHASE</span>
            <span className="text-[#00f2fe]">NOW (LIVE)</span>
          </div>
        </div>

        {/* Dual Metric Row: Wh/km + Pack Temp Trendline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Energy Efficiency Wh/km */}
          <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] uppercase">Efficiency (Wh/km)</span>
              <span className="font-telemetry-sm text-[13px] text-[#ffb95f]">
                218 <span className="text-[10px] text-[#b9cacb]">LIVE</span>
              </span>
            </div>

            <div className="w-full h-20 bg-[#0b0e15] border border-[#3a494b]/30 rounded-lg p-1 relative overflow-hidden">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 160 50">
                {/* Benchmark line (160 Wh/km) */}
                <line x1="0" y1="34" x2="160" y2="34" stroke="#4edea3" strokeWidth="1" strokeDasharray="3 3" />
                <text x="4" y="32" fill="#4edea3" fontFamily="JetBrains Mono" fontSize="6">
                  TARGET 160 Wh/km
                </text>
                {/* Actual line */}
                <path
                  d="M0,40 Q30,38 50,30 T100,20 T130,24 T160,14"
                  fill="none"
                  stroke="#ffb95f"
                  strokeWidth="1.8"
                />
                <circle cx="160" cy="14" r="2" fill="#ffb95f" />
              </svg>
            </div>

            <span className="font-body-sm text-[10px] text-[#ffb95f] mt-2 flex items-center justify-between">
              <span>Target Drift: +36.2%</span>
              <span className="font-label-caps text-[9px] text-[#b9cacb]">HEATING IMPACT</span>
            </span>
          </div>

          {/* Pack Temperature Trendline with Throttle Ceiling */}
          <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] uppercase">Thermal Ascent</span>
              <span className="font-telemetry-sm text-[13px] text-[#ffb4ab]">
                {state.packTempC}°C
              </span>
            </div>

            <div className="w-full h-20 bg-[#0b0e15] border border-[#3a494b]/30 rounded-lg p-1 relative overflow-hidden">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 160 50">
                {/* Critical Throttle 45C Threshold */}
                <line x1="0" y1="12" x2="160" y2="12" stroke="#ffb4ab" strokeWidth="1" strokeDasharray="2 2" />
                <text x="4" y="10" fill="#ffb4ab" fontFamily="JetBrains Mono" fontSize="6">
                  DERATE TRIP 45.0°C
                </text>
                {/* Ascent Curve */}
                <path
                  d="M0,42 C40,38 70,32 100,26 C125,21 145,16 160,14"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <circle cx="160" cy="14" r="2.5" fill="#ef4444" className="animate-pulse" />
              </svg>
            </div>

            <span className="font-body-sm text-[10px] text-[#b9cacb] mt-2 flex items-center justify-between">
              <span>Started: 28.0°C</span>
              <span className="text-[#ffb4ab] font-label-caps text-[9px]">
                MARGIN: +{Math.max(0, +(45.0 - state.packTempC).toFixed(1))}°C AVAIL
              </span>
            </span>
          </div>
        </div>

        {/* SoC Depletion & Estimated Range Curve */}
        <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow-md flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] text-[#e1e2ec] uppercase">
              SoC Depletion Vector &amp; Range Projections
            </span>
            <span className="font-telemetry-sm text-[12px] text-[#4edea3]">Slope: -0.18%/min</span>
          </div>

          <div className="relative w-full h-16 bg-[#0b0e15] border border-[#3a494b]/30 rounded-lg overflow-hidden flex items-center justify-center p-1">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 320 40">
              {/* Range corridor bands */}
              <polygon points="0,10 320,32 320,38 0,16" fill="#00dce6" opacity="0.08" />
              <line x1="0" y1="12" x2="320" y2="34" stroke="#4edea3" strokeWidth="1.5" />
              <circle cx="320" cy="34" r="2" fill="#4edea3" />
              <text x="8" y="24" fill="#849495" fontFamily="JetBrains Mono" fontSize="7">
                STEADY EXTRAPOLATION: 312 KM CUTOFF
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* SECTION 3: 96-CELL MODULE MATRIX MINI-GRID PREVIEW (12x8) */}
      <div className="bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f2fe] text-[18px]">grid_view</span>
            <div>
              <span className="font-label-caps text-[11px] text-[#e1e2ec] block uppercase">
                96-Cell Pack Matrix View
              </span>
              <span className="font-body-sm text-[10px] text-[#b9cacb]">
                12 x 8 Architecture • Cell Level Thermistor Feed (Click cell to inspect)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-label-caps text-[9px] text-[#b9cacb]">
              <span className="w-2 h-2 rounded bg-[#00f2fe]"></span> 38°C
            </span>
            <span className="flex items-center gap-1 font-label-caps text-[9px] text-[#b9cacb]">
              <span className="w-2 h-2 rounded bg-[#ffb95f]"></span> 42°C
            </span>
            <span className="flex items-center gap-1 font-label-caps text-[9px] text-[#b9cacb]">
              <span className="w-2 h-2 rounded bg-[#ffb4ab]"></span> 46°C
            </span>
          </div>
        </div>

        {/* 12 x 8 Heatmap Canvas Visual Mock */}
        <div className="bg-[#0b0e15] border border-[#3a494b]/30 p-2 rounded-lg overflow-x-auto no-scrollbar">
          <div className="grid grid-cols-12 gap-1 min-w-[280px]">
            {state.cells.map(cell => {
              // Determine color class based on temperature
              let cellBg = 'bg-[#00f2fe]/80 hover:bg-[#00f2fe]';
              if (cell.temp >= 45.0) {
                cellBg = 'bg-[#ffb4ab] animate-pulse hover:brightness-110';
              } else if (cell.temp >= 41.0) {
                cellBg = 'bg-[#ffb95f] hover:brightness-110';
              } else if (cell.temp > 38.5) {
                cellBg = 'bg-[#00f2fe]/90 hover:bg-[#00f2fe]';
              } else {
                cellBg = 'bg-[#00f2fe]/70 hover:bg-[#00f2fe]';
              }

              return (
                <div
                  key={cell.id}
                  onClick={() => handleCellClick(cell)}
                  title={`Cell ${cell.id} (M${cell.module}): ${cell.temp}°C | ${cell.voltage}V`}
                  className={`h-3.5 rounded cursor-pointer transition-all duration-200 ${cellBg}`}
                ></div>
              );
            })}
          </div>
        </div>

        {/* Anomaly summary bar & Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 border-t border-[#3a494b]/20">
          <div className="flex items-center gap-2 text-[#ffb4ab]">
            <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
            <span className="font-body-sm text-[11px] font-medium leading-none">
              HOTSPOT DETECTED: MODULE_04 [CELL_29/30 @ 46.2°C]
            </span>
          </div>

          <button
            onClick={() => setIsCellMatrixModalOpen(true)}
            className="bg-[#272a32] hover:bg-[#363941] text-[#00f2fe] border border-[#00f2fe]/30 px-3 py-1.5 rounded-lg font-label-caps text-[10px] uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer active:scale-95"
          >
            <span>Open Full Cell Matrix</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: THERMAL MANAGEMENT SUBSYSTEMS STATUS */}
      <div className="bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">ac_unit</span>
            <span className="font-label-caps text-[11px] text-[#e1e2ec] uppercase">
              Thermal Management Active Actuators
            </span>
          </div>
          <span className="font-label-caps text-[10px] text-[#4edea3] bg-[#1d1f27] border border-[#4edea3]/30 px-2 py-0.5 rounded">
            LOOP: GLYCOL 50/50
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Coolant Pump */}
          <div className="bg-[#1d1f27] border border-[#3a494b]/30 rounded-lg p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Coolant Flow</span>
              <span
                className={`material-symbols-outlined text-[#00f2fe] text-[16px] ${
                  state.isPlaying ? 'animate-spin' : ''
                }`}
              >
                cyclone
              </span>
            </div>
            <div>
              <span className="font-telemetry-md text-[18px] text-[#e1e2ec]">
                {state.coolantFlowLMin} <span className="text-xs text-[#b9cacb] font-telemetry-sm">L/min</span>
              </span>
              <div className="flex items-center justify-between font-body-sm text-[10px] text-[#b9cacb] mt-1">
                <span>{state.coolantDutyCyclePercent}% Duty Cycle</span>
                <span className="text-[#00f2fe]">{state.pumpRpm.toLocaleString()} RPM</span>
              </div>
            </div>
          </div>

          {/* Heat Pump */}
          <div className="bg-[#1d1f27] border border-[#3a494b]/30 rounded-lg p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">Heat Pump Mode</span>
              <span className="material-symbols-outlined text-[#00f2fe] text-[16px]">mode_fan</span>
            </div>
            <div>
              <span className="font-telemetry-md text-[18px] text-[#6ff6ff]">{state.heatPumpMode}</span>
              <div className="flex items-center justify-between font-body-sm text-[10px] text-[#b9cacb] mt-1">
                <span>Refrigerant Exp.</span>
                <span className="text-[#ffb95f]">High Load</span>
              </div>
            </div>
          </div>

          {/* BMS State */}
          <div className="bg-[#1d1f27] border border-[#3a494b]/30 rounded-lg p-2.5 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">BMS Node Health</span>
              <span className="material-symbols-outlined text-[#ffb95f] text-[16px]">shield_with_heart</span>
            </div>
            <div>
              <span className="font-telemetry-md text-[18px] text-[#e1e2ec]">{state.bmsHealthStatus}</span>
              <div className="flex items-center justify-between font-body-sm text-[10px] text-[#ffb4ab] mt-1">
                <span>{state.bmsAlertCount} Alert: Thermal M4</span>
                <span className="text-[#4edea3] font-label-caps text-[9px]">ISO OK</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: GLASS-BOX REAL-TIME JSON PAYLOAD INSPECTOR */}
      <div className="bg-[#0b0e15] border border-[#3a494b]/40 rounded-xl p-4 shadow-2xl flex flex-col gap-2 relative overflow-hidden">
        <div className="flex items-center justify-between pb-1 border-b border-[#3a494b]/30">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00f2fe] text-[16px]">data_object</span>
            <span className="font-label-caps text-[11px] text-[#e1e2ec] uppercase">
              // BMS_STREAM_FRAME_0x7FE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2 py-0.5 rounded bg-[#272a32] hover:bg-[#363941] text-[#00f2fe] font-label-caps text-[10px] transition-colors cursor-pointer"
            >
              {copied ? 'COPIED!' : 'COPY'}
            </button>
            <button
              onClick={() => setIsStreamPaused(!isStreamPaused)}
              className={`px-2 py-0.5 rounded bg-[#272a32] hover:bg-[#363941] font-label-caps text-[10px] transition-colors cursor-pointer ${
                isStreamPaused ? 'text-[#ffb95f]' : 'text-[#00f2fe]'
              }`}
            >
              {isStreamPaused ? 'RESUME STREAM' : 'PAUSE STREAM'}
            </button>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                !isStreamPaused ? 'bg-[#4edea3] animate-pulse' : 'bg-[#849495]'
              }`}
            ></span>
          </div>
        </div>

        {/* Monospace Obsidian Payload Terminal */}
        <pre className="font-telemetry-sm text-[12px] text-[#6ff6ff] bg-[#10131a]/90 border border-[#3a494b]/30 p-3 rounded-lg overflow-x-auto leading-relaxed max-h-52 no-scrollbar">
          {JSON.stringify(bmsPayload, null, 2)}
        </pre>

        <div className="flex items-center justify-between text-[#b9cacb] font-label-caps text-[9px] pt-1">
          <span>CRC32: 0x8C49F1B2</span>
          <span>PAYLOAD: 512 BYTES • 100% INTEGRITY</span>
        </div>
      </div>
    </div>
  );
};
