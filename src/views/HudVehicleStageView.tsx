import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { RoadSurface } from '../types/telemetry';

export const HudVehicleStageView: React.FC = () => {
  const {
    state,
    setSpeed,
    setPackTemp,
    setObstacleDistance,
    setAmbientTemp,
    setSurfaceCondition,
    togglePlay,
    setMultiplier,
    setMode,
    setScenario,
    applyCopilotStrategy,
  } = useTelemetry();

  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isJsonOpen, setIsJsonOpen] = useState(false);

  // Speed arc calculations (180 max km/h mapped to arc degrees)
  // Base arc: M 20 105 A 60 60 0 0 1 140 105
  // angle between 180 deg (left) and 0 deg (right)
  const speedRatio = Math.min(1, Math.max(0, state.speedKmh / 180));
  // arc end point
  const angleRad = Math.PI - speedRatio * Math.PI;
  const arcX = 80 + 60 * Math.cos(angleRad);
  const arcY = 105 - 60 * Math.sin(angleRad);
  const largeArcFlag = speedRatio > 0.5 ? 0 : 0;
  const speedArcD = `M 20 105 A 60 60 0 ${largeArcFlag} 1 ${arcX.toFixed(1)} ${arcY.toFixed(1)}`;

  // Risk ring dash offset (circumference = 2 * PI * 44 = ~276.46)
  const riskCircumference = 276.46;
  const riskOffset = riskCircumference - (state.riskScore / 100) * riskCircumference;

  const currentPayload = {
    timestamp: Date.now(),
    tick_hz: state.multiplier * 2,
    mode: state.mode,
    scenario: state.scenario,
    speed_kmh: state.speedKmh,
    recommended_speed_kmh: state.recommendedSpeedKmh,
    pack_temp_c: state.packTempC,
    ambient_temp_c: state.ambientTempC,
    obstacle_distance_m: state.obstacleDistanceM,
    road_condition: state.surfaceCondition,
    friction_mu: state.frictionMu,
    risk_score: state.riskScore,
    risk_grade: state.riskGrade,
    hover_elevation_m: state.altitudeM,
    pack_soc_pct: state.packSocPercent,
    power_kw: state.powerKw,
  };

  const surfaceNames: Record<RoadSurface, string> = {
    dry: 'DRY ROADWAY',
    wet: 'WET TARMAC',
    snow: 'COMPACTED SNOW',
    ice: 'BLACK ICE / WET TARMAC',
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 gap-4">
      {/* 1. TOP SIMULATION CONTROLLER BAR */}
      <section className="bg-[#1d1f27]/90 border border-[#3a494b]/40 rounded-xl p-3 shadow-xl flex flex-col gap-3 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          {/* Mode Toggle */}
          <div className="flex items-center p-0.5 bg-[#0b0e15] rounded-lg border border-[#3a494b]/30">
            <button
              onClick={() => setMode('MANUAL')}
              className={`px-3 py-1 rounded font-label-caps text-[11px] transition-colors cursor-pointer ${
                state.mode === 'MANUAL'
                  ? 'bg-[#00f2fe] text-[#00373a] font-bold shadow-md shadow-[#00f2fe]/20'
                  : 'text-[#b9cacb] hover:text-[#e1e2ec]'
              }`}
            >
              MANUAL
            </button>
            <button
              onClick={() => setMode('SCENARIO')}
              className={`px-3 py-1 rounded font-label-caps text-[11px] transition-colors cursor-pointer ${
                state.mode === 'SCENARIO'
                  ? 'bg-[#00f2fe] text-[#00373a] font-bold shadow-md shadow-[#00f2fe]/20'
                  : 'text-[#b9cacb] hover:text-[#e1e2ec]'
              }`}
            >
              SCENARIO
            </button>
          </div>

          {/* Play / Pause Main Trigger */}
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#272a32] hover:bg-[#363941] border border-[#3a494b]/40 transition-all active:scale-95 shadow-sm cursor-pointer ${
              state.isPlaying ? 'text-[#4edea3]' : 'text-[#b9cacb]'
            }`}
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {state.isPlaying ? 'pause' : 'play_arrow'}
            </span>
            <span className="font-label-caps text-[11px] uppercase">
              {state.isPlaying ? 'RUNNING' : 'PAUSED'}
            </span>
          </button>

          {/* Sync Chip */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0b0e15] border border-[#3a494b]/30">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                state.isPlaying ? 'bg-[#4edea3] animate-ping' : 'bg-[#849495]'
              }`}
            ></span>
            <span className="font-label-caps text-[10px] text-[#4edea3]">
              {state.multiplier * 2}Hz SYNC
            </span>
          </div>
        </div>

        {/* Scenario Dropdown & Tick Speeds */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#3a494b]/20">
          <div className="relative flex-1 min-w-0">
            <select
              value={state.scenario}
              onChange={e => setScenario(e.target.value)}
              className="w-full bg-[#0b0e15] border border-[#3a494b]/40 text-[#e0fdff] font-telemetry-sm text-[13px] rounded px-2.5 py-1.5 appearance-none focus:outline-none focus:border-[#00f2fe] truncate pr-7 cursor-pointer"
            >
              <option value="alpine">Alpine Freeze Ascent (-4°C)</option>
              <option value="runaway">Thermal Runaway Stress (+48°C)</option>
              <option value="urban">Urban Stop-and-Go (Low Speed)</option>
              <option value="hypermile">Highway Hyper-miling (90km/h)</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#b9cacb] text-[16px] pointer-events-none">
              expand_more
            </span>
          </div>

          {/* Multiplier Mini Chips */}
          <div className="flex items-center gap-1 bg-[#0b0e15] p-0.5 rounded border border-[#3a494b]/40 shrink-0">
            {([1, 4, 10] as const).map(s => (
              <button
                key={s}
                onClick={() => setMultiplier(s)}
                className={`px-2 py-1 font-label-caps text-[10px] rounded cursor-pointer transition-colors ${
                  state.multiplier === s
                    ? 'bg-[#00f2fe] text-[#00373a] font-bold shadow-sm'
                    : 'text-[#b9cacb] hover:text-[#e1e2ec]'
                }`}
              >
                {s}X
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. SAFETY HUD COCKPIT DISPLAY */}
      <section className="bg-[#1d1f27]/90 border border-[#3a494b]/40 rounded-xl p-4 shadow-xl flex flex-col gap-3 backdrop-blur-xl relative overflow-hidden">
        {/* Panel Header Micro-HUD */}
        <div className="flex items-center justify-between pb-1 border-b border-[#3a494b]/20">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00f2fe] text-[18px]">speed</span>
            <span className="font-label-caps text-[11px] text-[#00f2fe] uppercase tracking-wider">
              // HUD_VELOCITY_COCKPIT
            </span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0b0e15] border border-[#ffb95f]/30">
            <span className="font-label-caps text-[10px] text-[#ffb95f]">
              RECOM: {state.recommendedSpeedKmh} KM/H
            </span>
          </div>
        </div>

        {/* Dual Instrument Cluster: Speed Arc + Risk Ring */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center py-1">
          {/* Arc Speedometer */}
          <div className="flex flex-col items-center justify-center relative bg-[#0b0e15]/80 border border-[#3a494b]/30 rounded-xl p-3 min-h-[160px]">
            <svg className="w-44 h-32 overflow-visible" viewBox="0 0 160 120">
              <defs>
                <linearGradient id="speedTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3a494b" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3a494b" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="recomGreenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4edea3" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6ffbbe" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="speedArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00dce6" />
                  <stop offset="70%" stopColor="#00f2fe" />
                  <stop offset="100%" stopColor={state.speedKmh > 110 ? '#ffb95f' : '#00f2fe'} />
                </linearGradient>
              </defs>

              {/* Gauge Background Track (180 to 0 deg) */}
              <path
                d="M 20 105 A 60 60 0 0 1 140 105"
                fill="none"
                stroke="url(#speedTrackGrad)"
                strokeLinecap="round"
                strokeWidth="10"
              />

              {/* Green Recommended Target Zone Arc (approx 75-90 km/h) */}
              <path
                d="M 52 46 A 60 60 0 0 1 88 45"
                fill="none"
                stroke="url(#recomGreenGrad)"
                strokeLinecap="butt"
                strokeWidth="12"
              />

              {/* Dynamic Actual Speed Arc */}
              <path
                d={speedArcD}
                fill="none"
                stroke="url(#speedArcGrad)"
                strokeLinecap="round"
                strokeWidth="8"
                className="transition-all duration-300"
              />

              {/* Speed Target Tick */}
              <circle cx="70" cy="45" r="3" fill="#6ffbbe" className="animate-pulse" />
            </svg>

            {/* Speed Readout Overlay */}
            <div className="absolute bottom-2 flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="font-telemetry-xl text-[34px] text-[#e0fdff] font-black tracking-tight leading-none">
                  {state.speedKmh}
                </span>
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">KM/H</span>
              </div>
              <span className="font-label-caps text-[9px] text-[#4edea3] mt-0.5">
                OPTIMAL BAND: {state.recommendedSpeedKmh}
              </span>
            </div>
          </div>

          {/* Segmented Dynamic Risk Ring Gauge */}
          <div className="flex flex-col items-center justify-center relative bg-[#0b0e15]/80 border border-[#3a494b]/30 rounded-xl p-3 min-h-[160px]">
            <svg className="w-36 h-32 overflow-visible" viewBox="0 0 140 120">
              <defs>
                <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Base Ring */}
              <circle
                cx="70"
                cy="60"
                r="44"
                fill="none"
                stroke="#272a32"
                strokeWidth="7"
                strokeDasharray="3 3"
              />

              {/* Segmented dynamic risk indicator */}
              <circle
                cx="70"
                cy="60"
                r="44"
                fill="none"
                filter={state.riskScore > 50 ? 'url(#glow-amber)' : undefined}
                stroke={state.riskScore > 75 ? '#ffb4ab' : state.riskScore > 50 ? '#ffb95f' : '#4edea3'}
                strokeWidth="8"
                strokeDasharray="276.46"
                strokeDashoffset={riskOffset}
                strokeLinecap="round"
                transform="rotate(-90 70 60)"
                className="transition-all duration-500"
              />

              {/* Segment markers around circumference */}
              <line x1="70" y1="10" x2="70" y2="16" stroke="#4edea3" strokeWidth="2" />
              <line x1="114" y1="60" x2="108" y2="60" stroke="#ffb95f" strokeWidth="2" />
              <line x1="70" y1="110" x2="70" y2="104" stroke="#ffb4ab" strokeWidth="2" />
              <line x1="26" y1="60" x2="32" y2="60" stroke="#00f2fe" strokeWidth="2" />
            </svg>

            {/* Dynamic Risk Score Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-label-caps text-[9px] text-[#b9cacb] uppercase tracking-wider">
                RISK INDEX
              </span>
              <span
                className={`font-telemetry-md text-[20px] font-black leading-tight ${
                  state.riskScore > 75
                    ? 'text-[#ffb4ab]'
                    : state.riskScore > 50
                    ? 'text-[#ffb95f]'
                    : 'text-[#4edea3]'
                }`}
              >
                {state.riskScore}/100
              </span>
              <span
                className={`px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase font-bold mt-0.5 ${
                  state.riskScore > 75
                    ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                    : state.riskScore > 50
                    ? 'bg-[#ffd3a1]/20 text-[#ffb95f]'
                    : 'bg-[#00a572]/20 text-[#4edea3]'
                }`}
              >
                {state.riskGrade === 'CRITICAL_RED'
                  ? 'CRITICAL'
                  : state.riskGrade === 'CAUTION_AMBER'
                  ? 'CAUTION'
                  : 'NOMINAL'}
              </span>
            </div>
          </div>
        </div>

        {/* Prominent Recommendation Action Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#ffd3a1]/15 border border-[#ffb95f]/30 text-[#ffb95f] p-3 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[22px] text-[#ffb95f] shrink-0 animate-pulse">
              warning
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-label-caps text-[10px] text-[#ffb95f] uppercase tracking-wider font-bold">
                TACTICAL INTERVENTION REQUIRED
              </span>
              <span className="font-telemetry-sm text-[12px] text-[#e1e2ec] truncate font-semibold">
                REDUCE TO {state.recommendedSpeedKmh} KM/H · PREVENT PACK OVERHEATING
              </span>
            </div>
          </div>

          <button
            onClick={applyCopilotStrategy}
            className="self-end sm:self-auto px-3 py-1 rounded bg-[#00f2fe] text-[#00373a] hover:bg-[#6ff6ff] font-label-caps text-[10px] font-bold uppercase transition-all shadow-md active:scale-95 shrink-0 cursor-pointer"
          >
            Apply Now
          </button>
        </div>

        {/* Quick Telemetry Micro Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          <div className="flex flex-col items-center bg-[#0b0e15] border border-[#3a494b]/30 p-2 rounded">
            <span className="font-label-caps text-[9px] text-[#b9cacb]">PACK SOC</span>
            <span className="font-telemetry-sm text-[14px] text-[#00dce6] font-bold mt-0.5">
              {state.packSocPercent}%
            </span>
          </div>
          <div className="flex flex-col items-center bg-[#0b0e15] border border-[#3a494b]/30 p-2 rounded">
            <span className="font-label-caps text-[9px] text-[#ffb95f]">PACK TEMP</span>
            <span className="font-telemetry-sm text-[14px] text-[#ffb95f] font-bold mt-0.5">
              {state.packTempC}°C
            </span>
          </div>
          <div className="flex flex-col items-center bg-[#0b0e15] border border-[#3a494b]/30 p-2 rounded">
            <span className="font-label-caps text-[9px] text-[#b9cacb]">RANGE</span>
            <span className="font-telemetry-sm text-[14px] text-[#4edea3] font-bold mt-0.5">
              284 km
            </span>
          </div>
          <div className="flex flex-col items-center bg-[#0b0e15] border border-[#3a494b]/30 p-2 rounded">
            <span className="font-label-caps text-[9px] text-[#b9cacb]">POWER</span>
            <span className="font-telemetry-sm text-[14px] text-[#e0fdff] font-bold mt-0.5">
              {state.powerKw} kW
            </span>
          </div>
        </div>
      </section>

      {/* 3. FLYING-CAR VEHICLE STAGE & ATMOSPHERIC CHAMBER */}
      <section className="bg-[#1d1f27]/90 border border-[#3a494b]/40 rounded-xl p-4 shadow-xl flex flex-col gap-3 backdrop-blur-xl relative overflow-hidden">
        {/* Stage Header & State Beacon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">flight</span>
            <span className="font-label-caps text-[11px] text-[#4edea3] uppercase tracking-widest">
              // VEHICLE_STAGE_AERO_CHAMBER
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00a572]/20 border border-[#4edea3]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span className="font-label-caps text-[9px] text-[#4edea3] font-bold tracking-tight">
              STABILIZED / HOVER ACTIVE
            </span>
          </div>
        </div>

        {/* Atmospheric Chamber & Hover Vehicle Stage (Inline SVG) */}
        <div className="relative w-full h-56 bg-[#0b0e15] border border-[#3a494b]/40 rounded-xl overflow-hidden flex items-center justify-center">
          {/* Atmospheric Particle Canvas Backing */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="skyVoid" cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#006a70" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#0b0e15" stopOpacity="0.95" />
              </radialGradient>
              <filter id="thrusterGlow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#skyVoid)" />
            {/* Horizon Grid & Vector Altitude Lines */}
            <line x1="0" y1="130" x2="400" y2="130" stroke="#3a494b" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="#3a494b" strokeWidth="0.75" />
            <line x1="60" y1="130" x2="10" y2="210" stroke="#3a494b" strokeWidth="0.5" />
            <line x1="140" y1="130" x2="100" y2="210" stroke="#3a494b" strokeWidth="0.5" />
            <line x1="220" y1="130" x2="260" y2="210" stroke="#3a494b" strokeWidth="0.5" />
            <line x1="300" y1="130" x2="350" y2="210" stroke="#3a494b" strokeWidth="0.5" />
          </svg>

          {/* Hover Shadow under Vehicle */}
          <div
            className="absolute bottom-8 w-44 h-4 rounded-full bg-[#00f2fe]/20 blur-md transition-all duration-700"
            style={{
              transform: `scale(${1 - (state.altitudeM - 0.4) * 0.5})`,
            }}
          ></div>

          {/* Battery Pack Underglow (Amber/Cyan heat radiation) */}
          <div className="absolute bottom-10 w-32 h-6 rounded-full bg-[#ffb95f]/30 blur-lg animate-pulse pointer-events-none"></div>

          {/* Hovering Electric Vehicle Concept SVG */}
          <div
            className="relative z-10 w-64 sm:w-72 h-36 flex items-center justify-center transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateY(${-((state.altitudeM - 0.42) * 50)}px)`,
            }}
          >
            <svg
              className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,242,254,0.15)]"
              viewBox="0 0 280 140"
            >
              <defs>
                <linearGradient id="hullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#32353d" />
                  <stop offset="45%" stopColor="#1d1f27" />
                  <stop offset="100%" stopColor="#10131a" />
                </linearGradient>
                <linearGradient id="canopyGrad" x1="0%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#00696f" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10131a" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="packHeatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00dce6" stopOpacity="0.3" />
                  <stop offset="50%" stopColor={state.packTempC > 40 ? '#ffb95f' : '#00f2fe'} stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#00dce6" stopOpacity="0.3" />
                </linearGradient>
              </defs>

              {/* Rear Thrusters & High-Energy Plumes */}
              <g filter="url(#thrusterGlow)">
                <ellipse cx="44" cy="74" rx="14" ry="4" fill="#00f2fe" opacity="0.85" />
                <polygon points="44,72 12,74 44,76" fill="#00dce6" opacity="0.75" />
                <ellipse cx="236" cy="74" rx="14" ry="4" fill="#00f2fe" opacity="0.85" />
                <polygon points="236,72 268,74 236,76" fill="#00dce6" opacity="0.75" />
              </g>

              {/* Main Aero Fuselage */}
              <path
                d="M 50 78 Q 70 52 140 50 Q 210 52 230 78 Q 215 88 140 90 Q 65 88 50 78 Z"
                fill="url(#hullGrad)"
                stroke="#3a494b"
                strokeWidth="0.8"
              />

              {/* Cockpit Bubble Glass */}
              <path
                d="M 95 62 Q 140 40 185 62 Q 140 56 95 62 Z"
                fill="url(#canopyGrad)"
                stroke="#00f2fe"
                strokeWidth="0.75"
              />

              {/* Winglets / Aero Canards */}
              <path d="M 32 72 L 72 70 L 64 82 Z" fill="#272a32" />
              <path d="M 248 72 L 208 70 L 216 82 Z" fill="#272a32" />

              {/* High-Voltage Undercarriage Battery Cell Bay */}
              <rect x="100" y="80" width="80" height="6" rx="3" fill="url(#packHeatGrad)" />

              {/* Forward Sensor Array & Matrix Headlights */}
              <circle cx="140" cy="85" r="2.5" fill="#e0fdff" filter="url(#thrusterGlow)" />
              <line x1="120" y1="84" x2="160" y2="84" stroke="#00f2fe" strokeWidth="1.5" strokeLinecap="round" />

              {/* Micro Telemetry Markings on Hull */}
              <text
                x="140"
                y="74"
                fill="#b9cacb"
                fontFamily="JetBrains Mono"
                fontSize="5"
                textAnchor="middle"
                letterSpacing="1"
              >
                EV-STG-X1
              </text>
            </svg>
          </div>

          {/* Top Overlay Badges: Altitude & Thruster Output */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#272a32]/80 border border-[#3a494b]/40 backdrop-blur-md">
            <span className="material-symbols-outlined text-[#00f2fe] text-[14px]">height</span>
            <span className="font-label-caps text-[10px] text-[#e0fdff]">
              ALT: <span className="text-[#00f2fe] font-bold">{state.altitudeM} m</span>
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#272a32]/80 border border-[#3a494b]/40 backdrop-blur-md">
            <span className="material-symbols-outlined text-[#4edea3] text-[14px]">bolt</span>
            <span className="font-label-caps text-[10px] text-[#e1e2ec]">
              THRUST: <span className="text-[#4edea3] font-bold">FWD {state.thrustKw} kW</span>
            </span>
          </div>

          {/* Bottom Road Condition Hologram Overlay */}
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between px-2.5 py-1 rounded bg-[#272a32]/80 border border-[#3a494b]/40 backdrop-blur-md">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[#ffb95f] text-[16px] shrink-0">
                ac_unit
              </span>
              <span className="font-label-caps text-[10px] text-[#ffb95f] uppercase font-semibold truncate">
                SURFACE: {surfaceNames[state.surfaceCondition]}
              </span>
            </div>
            <span className="font-label-caps text-[9px] text-[#b9cacb] shrink-0">
              μ = {state.frictionMu} SLIP
            </span>
          </div>
        </div>
      </section>

      {/* 4. TACTICAL INPUT SLIDERS WIDGET (COLLAPSIBLE / DRAWER) */}
      <section className="bg-[#1d1f27]/90 border border-[#3a494b]/40 rounded-xl p-4 shadow-xl flex flex-col gap-3 backdrop-blur-xl">
        {/* Accordion Header */}
        <div
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00f2fe] text-[18px]">tune</span>
            <span className="font-label-caps text-[11px] text-[#e0fdff] uppercase tracking-wider">
              // TACTICAL_INPUT_CONTROLLERS
            </span>
          </div>
          <div className="flex items-center gap-1 text-[#b9cacb]">
            <span className="font-label-caps text-[10px]">
              {isDrawerOpen ? 'EXPANDED' : 'COLLAPSED'}
            </span>
            <span
              className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${
                isDrawerOpen ? 'rotate-0' : 'rotate-180'
              }`}
            >
              expand_less
            </span>
          </div>
        </div>

        {/* Sliders Form Container */}
        {isDrawerOpen && (
          <div className="flex flex-col gap-3 pt-1 transition-all">
            {/* 1. Target Speed */}
            <div className="flex flex-col gap-1.5 bg-[#0b0e15]/80 border border-[#3a494b]/30 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">
                  TARGET VEHICLE SPEED
                </span>
                <span className="font-telemetry-sm text-[13px] text-[#00dce6] font-bold">
                  {state.speedKmh} km/h
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={state.speedKmh}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full h-1.5 bg-[#32353d] rounded-lg appearance-none cursor-pointer accent-[#00f2fe]"
              />
              <div className="flex justify-between font-label-caps text-[9px] text-[#849495]">
                <span>0 KM/H</span>
                <span className="text-[#4edea3] font-bold">RECOM: {state.recommendedSpeedKmh} KM/H</span>
                <span>180 KM/H</span>
              </div>
            </div>

            {/* 2. Battery Temperature */}
            <div className="flex flex-col gap-1.5 bg-[#0b0e15]/80 border border-[#3a494b]/30 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">
                  PACK CELL TEMPERATURE
                </span>
                <span className="font-telemetry-sm text-[13px] text-[#ffb95f] font-bold">
                  {state.packTempC} °C
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="70"
                step="0.2"
                value={state.packTempC}
                onChange={e => setPackTemp(Number(e.target.value))}
                className="w-full h-1.5 bg-[#32353d] rounded-lg appearance-none cursor-pointer accent-[#ffb95f]"
              />
              <div className="flex justify-between font-label-caps text-[9px] text-[#849495]">
                <span>-30°C</span>
                <span className="text-[#4edea3] font-bold">NOMINAL: 25°C</span>
                <span className="text-[#ffb4ab] font-bold">70°C CRIT</span>
              </div>
            </div>

            {/* 3. Obstacle Distance */}
            <div className="flex flex-col gap-1.5 bg-[#0b0e15]/80 border border-[#3a494b]/30 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">
                  LIDAR RADAR DISTANCE
                </span>
                <span className="font-telemetry-sm text-[13px] text-[#e0fdff] font-bold">
                  {state.obstacleDistanceM} m
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="1"
                value={state.obstacleDistanceM}
                onChange={e => setObstacleDistance(Number(e.target.value))}
                className="w-full h-1.5 bg-[#32353d] rounded-lg appearance-none cursor-pointer accent-[#e0fdff]"
              />
              <div className="flex justify-between font-label-caps text-[9px] text-[#849495]">
                <span className="text-[#ffb4ab] font-bold">0 m (COLLISION)</span>
                <span className="text-[#e1e2ec]">{state.obstacleDistanceM} m</span>
                <span>300 m CLEAR</span>
              </div>
            </div>

            {/* 4. Ambient Temperature */}
            <div className="flex flex-col gap-1.5 bg-[#0b0e15]/80 border border-[#3a494b]/30 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">
                  ATMOSPHERIC AMBIENT
                </span>
                <span className="font-telemetry-sm text-[13px] text-[#e0fdff] font-bold">
                  {state.ambientTempC} °C
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="55"
                step="1"
                value={state.ambientTempC}
                onChange={e => setAmbientTemp(Number(e.target.value))}
                className="w-full h-1.5 bg-[#32353d] rounded-lg appearance-none cursor-pointer accent-[#e0fdff]"
              />
              <div className="flex justify-between font-label-caps text-[9px] text-[#849495]">
                <span>-30°C FREEZE</span>
                <span>0°C</span>
                <span>+55°C ARID</span>
              </div>
            </div>

            {/* Traction Surface Condition Pills */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">
                TRACTION SURFACE CONDITION
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(['dry', 'wet', 'snow', 'ice'] as RoadSurface[]).map(s => {
                  const isSelected = state.surfaceCondition === s;
                  return (
                    <button
                      key={s}
                      onClick={() => setSurfaceCondition(s)}
                      className={`px-2 py-1.5 rounded font-label-caps text-[10px] transition-all cursor-pointer uppercase ${
                        isSelected
                          ? 'bg-[#ffb95f] text-[#472a00] font-bold shadow-md shadow-[#ffb95f]/20'
                          : 'bg-[#0b0e15] border border-[#3a494b]/40 text-[#b9cacb] hover:text-[#e1e2ec]'
                      }`}
                    >
                      {s === 'ice' ? 'BLACK ICE' : s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. GLASS-BOX RAW TICK JSON FOOTER TOGGLE */}
      <section className="bg-[#1d1f27]/90 border border-[#3a494b]/40 rounded-xl p-4 shadow-xl flex flex-col gap-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsJsonOpen(!isJsonOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#272a32] hover:bg-[#363941] text-[#00f2fe] border border-[#00f2fe]/30 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">data_object</span>
            <span className="font-label-caps text-[11px] uppercase font-bold tracking-wider">
              {isJsonOpen ? 'Hide Raw Tick JSON' : 'Inspect Raw Tick JSON (2Hz HTTP)'}
            </span>
          </button>
          <span className="font-label-caps text-[10px] text-[#4edea3] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
            STREAM OK
          </span>
        </div>

        {/* Collapsible JSON Terminal Pre */}
        {isJsonOpen && (
          <div className="flex flex-col gap-1 bg-[#0b0e15] border border-[#3a494b]/40 p-3 rounded-lg">
            <div className="flex items-center justify-between pb-1 border-b border-[#3a494b]/30">
              <span className="font-label-caps text-[9px] text-[#b9cacb]">
                // PAYLOAD_SAMPLE_ID: 0x882F_B7
              </span>
              <span className="font-label-caps text-[9px] text-[#00f2fe]">
                CONTENT-TYPE: APPLICATION/JSON
              </span>
            </div>
            <pre className="font-telemetry-sm text-[11px] text-[#e0fdff] leading-relaxed overflow-x-auto whitespace-pre no-scrollbar p-1">
              {JSON.stringify(currentPayload, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
};
