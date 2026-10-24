import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../context/TelemetryContext';

export const DigitalTwinRadarView: React.FC = () => {
  const { state, engageIntervention } = useTelemetry();

  // Radar scale (50, 100, 200, 300)
  const [radarScale, setRadarScale] = useState<number>(100);

  // Radar layer visibility toggles
  const [showTwinGhost, setShowTwinGhost] = useState(true);
  const [showStoppingArcs, setShowStoppingArcs] = useState(true);
  const [showFrictionMap, setShowFrictionMap] = useState(true);
  const [showHeadingVector, setShowHeadingVector] = useState(true);

  // Sweep animation rotation
  const [sweepAngle, setSweepAngle] = useState(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    let currentAngle = 0;
    const animate = () => {
      if (state.isPlaying) {
        currentAngle = (currentAngle + 1.6 * state.multiplier) % 360;
        setSweepAngle(currentAngle);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [state.isPlaying, state.multiplier]);

  // Stopping distance math for radar rendering (scale relative to 100m base)
  const scaleFactor = 100 / radarScale;
  // obstacle pos (y=200 - (state.obstacleDistanceM * scaleFactor * 1.4))
  const obstacleY = Math.max(30, Math.min(180, 200 - state.obstacleDistanceM * scaleFactor * 1.35));
  // real stopping arc Y
  const realStopY = Math.max(40, Math.min(185, 200 - state.realStoppingDistanceM * scaleFactor * 1.35));
  // twin stopping arc Y
  const twinStopY = Math.max(50, Math.min(190, 200 - state.twinStoppingDistanceM * scaleFactor * 1.35));
  // twin ghost car position
  const twinGhostY = Math.max(60, 200 - (state.twinAdvanceM + 25) * scaleFactor);

  const kinematicsPayload = {
    timestamp_epoch_ms: Date.now(),
    obstacle_distance_m: state.obstacleDistanceM,
    time_to_collision_s: state.timeToCollisionS,
    friction_mu: state.frictionMu,
    stopping_distance_real_m: state.realStoppingDistanceM,
    stopping_distance_twin_m: state.twinStoppingDistanceM,
    delta_safe_margin_m: +(state.obstacleDistanceM - state.realStoppingDistanceM).toFixed(1),
    regen_torque_limit_nm: state.frictionMu < 0.4 ? 380 : 720,
    co_pilot_intervened: state.coPilotInterventionEngaged,
  };

  const deltaMargin = +(state.obstacleDistanceM - state.realStoppingDistanceM).toFixed(1);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 gap-4">
      {/* CRITICAL HAZARD / SAFETY STATUS BANNER */}
      <div
        className={`w-full rounded-xl p-3 shadow-lg flex items-center justify-between border ${
          deltaMargin < 0
            ? 'bg-[#93000a]/20 border-[#ffb4ab]/40'
            : 'bg-[#00a572]/20 border-[#4edea3]/40'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`material-symbols-outlined text-[22px] shrink-0 ${
              deltaMargin < 0 ? 'text-[#ffb4ab] animate-pulse' : 'text-[#4edea3]'
            }`}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {deltaMargin < 0 ? 'warning' : 'verified_user'}
          </span>
          <div className="flex flex-col min-w-0">
            <span
              className={`font-label-caps text-[11px] tracking-wider uppercase truncate font-bold ${
                deltaMargin < 0 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'
              }`}
            >
              {deltaMargin < 0 ? 'CRITICAL HAZARD DETECTED' : 'SAFETY ENVELOPE NOMINAL'}
            </span>
            <span className="font-body-sm text-[12px] text-[#e1e2ec] truncate">
              {deltaMargin < 0
                ? `Stopping distance exceeds safe margin (${deltaMargin}m)`
                : `Safe buffer maintained: +${deltaMargin}m clear`}
            </span>
          </div>
        </div>

        <span
          className={`px-2 py-0.5 rounded font-label-caps text-[10px] shrink-0 uppercase font-bold ${
            deltaMargin < 0 ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#4edea3] text-[#003824]'
          }`}
        >
          μ: {state.frictionMu} {state.surfaceCondition.toUpperCase()}
        </span>
      </div>

      {/* 360° HIGH-TECH RADAR CANVAS */}
      <div className="relative w-full max-w-lg mx-auto aspect-square rounded-xl bg-[#0b0e15] border border-[#3a494b]/50 overflow-hidden shadow-2xl flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00f2fe]/5 via-transparent to-[#191b23]/40 pointer-events-none"></div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
          <defs>
            <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#00f2fe" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="amberArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffb95f" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#ffb95f" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffb95f" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="twinArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4edea3" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#4edea3" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#4edea3" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Crosshair Grids */}
          <line x1="200" y1="20" x2="200" y2="380" stroke="#3a494b" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.45" />
          <line x1="20" y1="200" x2="380" y2="200" stroke="#3a494b" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.45" />
          <line x1="72" y1="72" x2="328" y2="328" stroke="#3a494b" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.25" />
          <line x1="328" y1="72" x2="72" y2="328" stroke="#3a494b" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.25" />

          {/* Concentric Range Rings */}
          <circle cx="200" cy="200" r="45" fill="none" stroke="#3a494b" strokeWidth="0.75" opacity="0.4" />
          <circle cx="200" cy="200" r="90" fill="none" stroke="#3a494b" strokeWidth="0.75" opacity="0.4" />
          <circle cx="200" cy="200" r="135" fill="none" stroke="#3a494b" strokeWidth="0.75" opacity="0.35" />
          <circle cx="200" cy="200" r="180" fill="none" stroke="#3a494b" strokeWidth="1" opacity="0.5" />

          {/* Layer: Stopping Arcs */}
          {showStoppingArcs && (
            <g className="transition-opacity duration-300">
              {/* Real stopping arc */}
              <path
                d={`M 125 ${realStopY + 12} A 120 120 0 0 1 275 ${realStopY + 12}`}
                fill="none"
                stroke="url(#amberArcGrad)"
                strokeLinecap="round"
                strokeWidth="3"
              />
              <text x="282" y={realStopY + 10} fill="#ffb95f" className="font-label-caps text-[9px] font-bold">
                REAL STOP {state.realStoppingDistanceM}m
              </text>

              {/* Twin stopping arc */}
              <path
                d={`M 148 ${twinStopY + 28} A 78 78 0 0 1 252 ${twinStopY + 28}`}
                fill="none"
                stroke="url(#twinArcGrad)"
                strokeLinecap="round"
                strokeWidth="2.5"
                strokeDasharray="4,2"
              />
              <text x="256" y={twinStopY + 30} fill="#4edea3" className="font-label-caps text-[9px] font-bold">
                TWIN STOP {state.twinStoppingDistanceM}m
              </text>
            </g>
          )}

          {/* Layer: Trajectory Heading Vector */}
          {showHeadingVector && (
            <g className="transition-opacity duration-300">
              <line
                x1="200"
                y1="200"
                x2="200"
                y2="60"
                stroke="#00f2fe"
                strokeWidth="1.2"
                strokeDasharray="2,2"
                opacity="0.65"
              />
              <polygon points="200,55 197,64 203,64" fill="#00f2fe" />
            </g>
          )}

          {/* Layer: Friction Surface Map */}
          {showFrictionMap && state.frictionMu < 0.5 && (
            <g className="transition-opacity duration-300">
              <ellipse cx="200" cy={obstacleY + 5} rx="85" ry="32" fill="#32353d" opacity="0.4" />
              <text x="140" y={obstacleY - 8} fill="#b9cacb" className="font-label-caps text-[8px] uppercase tracking-wider">
                PATCH: LOW GRIP μ {state.frictionMu}
              </text>
            </g>
          )}

          {/* Rotating Radar Sweep Line & Beam */}
          <g transform={`translate(200, 200) rotate(${sweepAngle})`}>
            <path d="M 0 0 L 180 0 A 180 180 0 0 0 127 -127 Z" fill="url(#radarSweepGrad)" />
            <line x1="0" y1="0" x2="180" y2="0" stroke="#00f2fe" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Target Obstacle (TGT-01) */}
          <g transform={`translate(200, ${obstacleY})`}>
            <circle cx="0" cy="0" r="14" fill="#93000a" opacity="0.3" className="animate-ping" />
            <circle cx="0" cy="0" r="7" fill="#ffb4ab" />
            <line x1="0" y1="0" x2="-14" y2="-12" stroke="#ffb4ab" strokeWidth="1.5" />
            <circle cx="-14" cy="-12" r="1.5" fill="#ffb4ab" />
            <text x="12" y="3" fill="#ffb4ab" className="font-label-caps text-[10px] font-bold">
              TGT-01 [{state.obstacleDistanceM}m]
            </text>
            <text x="12" y="13" fill="#b9cacb" className="font-label-caps text-[8px]">
              ΔV: -34 km/h
            </text>
          </g>

          {/* Layer: Twin Ghost Vehicle */}
          {showTwinGhost && (
            <g className="transition-opacity duration-300" transform={`translate(200, ${twinGhostY})`}>
              <rect x="-9" y="-16" width="18" height="32" rx="3" fill="#00a572" opacity="0.25" />
              <rect
                x="-7"
                y="-14"
                width="14"
                height="28"
                rx="2"
                fill="none"
                stroke="#4edea3"
                strokeWidth="1.2"
                strokeDasharray="2,1"
              />
              <line x1="-3" y1="-8" x2="3" y2="-8" stroke="#4edea3" strokeWidth="1.5" />
              <text x="12" y="2" fill="#4edea3" className="font-label-caps text-[9px] uppercase font-bold">
                TWIN [{state.twinAdvanceM}M ADV]
              </text>
            </g>
          )}

          {/* Real Vehicle at Center (200, 200) */}
          <g transform="translate(200, 200)">
            <ellipse cx="0" cy="0" rx="16" ry="16" fill="#00f2fe" opacity="0.1" className="animate-pulse" />
            <rect x="-10" y="-18" width="20" height="36" rx="4" fill="#00373a" />
            <rect x="-8" y="-16" width="16" height="32" rx="3" fill="#00f2fe" />
            <rect x="-5" y="-12" width="10" height="8" rx="1" fill="#002022" />
            <circle cx="0" cy="6" r="2" fill="#ffffff" />
            <line x1="0" y1="-18" x2="0" y2="-26" stroke="#00f2fe" strokeWidth="1.5" />
          </g>
        </svg>

        {/* Top Radar Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col">
          <span className="font-label-caps text-[9px] text-[#00f2fe] tracking-wider uppercase">
            RADAR RANGE
          </span>
          <span className="font-telemetry-sm text-[13px] text-[#e1e2ec] font-bold">
            {radarScale} METERS
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 flex flex-col items-end">
          <span className="font-label-caps text-[9px] text-[#4edea3] tracking-wider uppercase">
            TWIN PREDICTOR
          </span>
          <span className="font-telemetry-sm text-[13px] text-[#4edea3] font-bold">
            ACTIVE · 60Hz
          </span>
        </div>

        {/* Bottom Radar Overlay Badges */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-[#272a32]/80 border border-[#3a494b]/40 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
          <span className="font-label-caps text-[9px] text-[#e1e2ec] uppercase">
            TTC: {state.timeToCollisionS}s
          </span>
        </div>

        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 bg-[#272a32]/80 border border-[#3a494b]/40 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse"></span>
          <span className="font-label-caps text-[9px] text-[#ffb4ab] uppercase">
            {deltaMargin < 0 ? 'DECEL LIMIT' : 'CLEAR PATH'}
          </span>
        </div>
      </div>

      {/* 4-METRIC GRID */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {/* Metric 1: Obstacle Range */}
        <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase truncate">
              OBSTACLE RANGE
            </span>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[16px]">sensors</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-telemetry-xl text-[28px] sm:text-[34px] text-[#e1e2ec] font-bold">
              {state.obstacleDistanceM}
            </span>
            <span className="font-label-caps text-[11px] text-[#b9cacb]">m</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 bg-[#272a32]/30 rounded px-2 py-0.5">
            <span className="font-label-caps text-[10px] text-[#b9cacb]">TTC WINDOW</span>
            <span className="font-telemetry-sm text-[12px] text-[#ffb4ab]">
              {state.timeToCollisionS} SEC
            </span>
          </div>
        </div>

        {/* Metric 2: Road Friction */}
        <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase truncate">
              ROAD FRICTION (μ)
            </span>
            <span className="material-symbols-outlined text-[#ffb95f] text-[16px]">ac_unit</span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-telemetry-xl text-[28px] sm:text-[34px] text-[#ffb95f] font-bold">
              {state.frictionMu}
            </span>
            <span className="font-label-caps text-[10px] text-[#ffb95f] uppercase truncate">
              {state.surfaceCondition === 'ice' ? 'BLACK ICE' : state.surfaceCondition}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 bg-[#272a32]/30 rounded px-2 py-0.5">
            <span className="font-label-caps text-[10px] text-[#b9cacb]">NORMAL DRY</span>
            <span className="font-telemetry-sm text-[12px] text-[#b9cacb]">0.85 μ</span>
          </div>
        </div>

        {/* Metric 3: Regen Torque */}
        <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase truncate">
              REGEN TORQUE
            </span>
            <span className="material-symbols-outlined text-[#00f2fe] text-[16px]">electric_bolt</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-telemetry-xl text-[28px] sm:text-[34px] text-[#00f2fe] font-bold">
              {state.frictionMu < 0.4 ? 380 : 720}
            </span>
            <span className="font-label-caps text-[11px] text-[#b9cacb]">Nm</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 bg-[#272a32]/30 rounded px-2 py-0.5">
            <span className="font-label-caps text-[10px] text-[#b9cacb]">STATUS</span>
            <span className="font-label-caps text-[10px] text-[#ffb95f] uppercase truncate">
              {state.frictionMu < 0.4 ? 'LOW-GRIP CUTOFF' : 'FULL REGEN AVAIL'}
            </span>
          </div>
        </div>

        {/* Metric 4: Twin Delta */}
        <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase truncate">
              TWIN DELTA
            </span>
            <span className="material-symbols-outlined text-[#4edea3] text-[16px]">compare_arrows</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-telemetry-xl text-[28px] sm:text-[34px] text-[#4edea3] font-bold">
              {state.twinDeltaSpeedKmh}
            </span>
            <span className="font-label-caps text-[11px] text-[#b9cacb]">km/h</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 bg-[#272a32]/30 rounded px-2 py-0.5">
            <span className="font-label-caps text-[10px] text-[#b9cacb]">VARIANCE</span>
            <span className="font-label-caps text-[10px] text-[#4edea3] uppercase truncate">
              BELOW AI REC
            </span>
          </div>
        </div>
      </div>

      {/* RADAR SCALE & TELEMETRY LAYERS */}
      <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-[11px] text-[#00f2fe] uppercase tracking-wider">
            RADAR SCALE &amp; TELEMETRY LAYERS
          </span>
          <span className="font-label-caps text-[10px] text-[#b9cacb]">CONFIG // 04</span>
        </div>

        {/* Scale buttons */}
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-[#0b0e15] border border-[#3a494b]/40 rounded">
          {[50, 100, 200, 300].map(meters => (
            <button
              key={meters}
              onClick={() => setRadarScale(meters)}
              className={`py-1 font-label-caps text-[11px] rounded transition-colors min-h-[30px] cursor-pointer ${
                radarScale === meters
                  ? 'bg-[#00f2fe] text-[#00373a] font-bold'
                  : 'text-[#b9cacb] hover:text-[#e1e2ec]'
              }`}
            >
              {meters}m
            </button>
          ))}
        </div>

        {/* Layer Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            onClick={() => setShowTwinGhost(!showTwinGhost)}
            className="flex items-center justify-between px-3 py-1.5 rounded bg-[#1d1f27] hover:bg-[#272a32] text-[#e1e2ec] border border-[#3a494b]/30 min-h-[36px] active:scale-95 transition-all cursor-pointer"
          >
            <span className="font-label-caps text-[11px] uppercase">Twin Ghost</span>
            <span
              className={`w-2 h-2 rounded-full ${
                showTwinGhost ? 'bg-[#4edea3]' : 'bg-[#3a494b]'
              }`}
            ></span>
          </button>

          <button
            onClick={() => setShowStoppingArcs(!showStoppingArcs)}
            className="flex items-center justify-between px-3 py-1.5 rounded bg-[#1d1f27] hover:bg-[#272a32] text-[#e1e2ec] border border-[#3a494b]/30 min-h-[36px] active:scale-95 transition-all cursor-pointer"
          >
            <span className="font-label-caps text-[11px] uppercase">Stopping Arcs</span>
            <span
              className={`w-2 h-2 rounded-full ${
                showStoppingArcs ? 'bg-[#4edea3]' : 'bg-[#3a494b]'
              }`}
            ></span>
          </button>

          <button
            onClick={() => setShowFrictionMap(!showFrictionMap)}
            className="flex items-center justify-between px-3 py-1.5 rounded bg-[#1d1f27] hover:bg-[#272a32] text-[#e1e2ec] border border-[#3a494b]/30 min-h-[36px] active:scale-95 transition-all cursor-pointer"
          >
            <span className="font-label-caps text-[11px] uppercase">Friction Map</span>
            <span
              className={`w-2 h-2 rounded-full ${
                showFrictionMap ? 'bg-[#4edea3]' : 'bg-[#3a494b]'
              }`}
            ></span>
          </button>

          <button
            onClick={() => setShowHeadingVector(!showHeadingVector)}
            className="flex items-center justify-between px-3 py-1.5 rounded bg-[#1d1f27] hover:bg-[#272a32] text-[#e1e2ec] border border-[#3a494b]/30 min-h-[36px] active:scale-95 transition-all cursor-pointer"
          >
            <span className="font-label-caps text-[11px] uppercase">Heading Vector</span>
            <span
              className={`w-2 h-2 rounded-full ${
                showHeadingVector ? 'bg-[#4edea3]' : 'bg-[#3a494b]'
              }`}
            ></span>
          </button>
        </div>
      </div>

      {/* GLASS-BOX KINEMATICS STREAM */}
      <div className="bg-[#191b23] border border-[#3a494b]/30 rounded-xl p-3 shadow flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#00f2fe] text-[16px]">data_object</span>
            <span className="font-label-caps text-[11px] text-[#00f2fe] uppercase tracking-wider">
              GLASS-BOX KINEMATICS STREAM
            </span>
          </div>
          <span className="font-label-caps text-[10px] text-[#4edea3] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
            STREAMING
          </span>
        </div>

        <div className="bg-[#0b0e15] border border-[#3a494b]/40 p-3 rounded-lg overflow-x-auto no-scrollbar font-telemetry-sm text-[12px] text-[#b9cacb]">
          <pre className="leading-relaxed">
            {JSON.stringify(kinematicsPayload, null, 2)}
          </pre>
        </div>
      </div>

      {/* PREDICTIVE CO-PILOT INTERVENTION CARD */}
      <div className="bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-3 shadow flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded bg-[#272a32] border border-[#00f2fe]/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#00f2fe] text-[20px]">psychology</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-[14px] text-[#e1e2ec] truncate">
              Predictive Co-Pilot Intervention
            </span>
            <span className="font-body-sm text-[11px] text-[#b9cacb] truncate">
              Micro-pulsing ABS &amp; dynamic torque vectoring primed
            </span>
          </div>
        </div>

        <button
          onClick={engageIntervention}
          className={`px-4 py-1.5 rounded font-label-caps text-[11px] font-bold shrink-0 min-h-[36px] transition-all cursor-pointer active:scale-95 shadow-md ${
            state.coPilotInterventionEngaged
              ? 'bg-[#00a572] text-[#00311f]'
              : 'bg-[#00f2fe] hover:bg-[#6ff6ff] text-[#00373a]'
          }`}
        >
          {state.coPilotInterventionEngaged ? 'ENGAGED' : 'ENGAGE'}
        </button>
      </div>
    </div>
  );
};
