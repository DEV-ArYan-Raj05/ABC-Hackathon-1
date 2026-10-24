import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { ActivePerturbation } from '../types/telemetry';

export const ChaosInjectionView: React.FC = () => {
  const {
    state,
    triggerFault,
    clearAllFaults,
    triggerCocktail,
    applyCopilotStrategy,
    simulateAlternative,
  } = useTelemetry();

  const [jsonTab, setJsonTab] = useState<'pipeline' | 'raw'>('pipeline');
  const [copied, setCopied] = useState(false);
  const [strategyApplied, setStrategyApplied] = useState(false);

  // Cooling timer formatting
  const coolingFault = state.activeFaults.find(f => f.name.includes('Cooling'));
  const coolingSecs = coolingFault?.timeRemaining ?? 0;
  const coolingTimeStr = coolingSecs > 0 ? `00:${coolingSecs < 10 ? '0' : ''}${coolingSecs}` : 'RESOLVED';

  const evalEnvelopePayload = {
    ambient_temp_c: state.ambientTempC,
    pack_therm_c: state.packTempC,
    mu_friction: state.frictionMu,
    cell_delta_mv: Math.round(state.cellSpreadDeltaV * 1000),
    copilot_mitigation: {
      throttle_limit_kw: state.packTempC > 40 ? 80.0 : 150.0,
      target_v_kmh: state.recommendedSpeedKmh,
      delta_soc_recovery: '+14.2%',
    },
    sim_status: state.kalmanRecoveryPercent > 70 ? 'ENVELOPE_RETAINED' : 'ADAPTIVE_STABILIZATION',
  };

  const rawTelemetryPayload = {
    timestamp: Date.now() / 1000,
    active_perturbations: state.activeFaults.map(f => f.label),
    hvac_power_draw_w: state.ambientTempC > 30 ? 8420 : 1200,
    inverter_status: state.packTempC > 45 ? 'THERMAL_DERATE' : 'NOMINAL_OPERATION',
    kalman_state_vector: [0.94, 0.78, 0.82, 0.65],
  };

  const handleApplyStrategy = () => {
    applyCopilotStrategy();
    setStrategyApplied(true);
    setTimeout(() => setStrategyApplied(false), 3000);
  };

  const handleCopy = () => {
    const text = jsonTab === 'pipeline'
      ? JSON.stringify(evalEnvelopePayload, null, 2)
      : JSON.stringify(rawTelemetryPayload, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 gap-4">
      {/* 1. ACTIVE CHAOS HUD STATUS BANNER */}
      <div className="flex flex-col w-full bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-ping"></span>
            <span className="font-label-caps text-[11px] text-[#ffb4ab] tracking-wider uppercase font-bold">
              PERMUTATION FAULT MATRIX
            </span>
          </div>
          <span className="font-telemetry-sm text-[12px] text-[#b9cacb] bg-[#1d1f27] border border-[#3a494b]/30 px-2 py-0.5 rounded">
            ENV: DYNAMIC STRESS
          </span>
        </div>

        {/* Active Injections Horizontal Stream */}
        <div className="flex flex-wrap items-center gap-2">
          {coolingFault ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#93000a]/40 text-[#ffdad6] border border-[#ffb4ab]/30 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">mode_heat</span>
              <span className="font-label-caps text-[11px] font-bold">
                COOLING FAIL: <span className="font-telemetry-sm text-[#ffb4ab]">{coolingTimeStr}</span>
              </span>
            </div>
          ) : null}

          {state.activeFaults
            .filter(f => !f.name.includes('Cooling'))
            .map(f => (
              <div
                key={f.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#ffd3a1]/25 text-[#ffb95f] border border-[#ffb95f]/30 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-[#ffb95f]">
                  {f.type === 'friction' ? 'ac_unit' : f.type === 'critical' ? 'warning' : 'bolt'}
                </span>
                <span className="font-label-caps text-[11px] font-bold">
                  {f.label}: <span className="font-telemetry-sm">{f.detail}</span>
                </span>
              </div>
            ))}

          {state.activeFaults.length === 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#00a572]/20 text-[#4edea3] border border-[#4edea3]/30">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="font-label-caps text-[11px] font-bold">
                ALL SIMULATED PERTURBATIONS FLUSHED
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. CHAOS INJECTION COMMAND GRID */}
      <div className="flex flex-col w-full bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f2fe] text-[20px]">bolt</span>
            <h2 className="font-headline-sm text-[18px] text-[#e1e2ec] tracking-tight">Chaos Injector Hub</h2>
          </div>
          <span className="font-label-caps text-[10px] text-[#00f2fe] bg-[#1d1f27] border border-[#00f2fe]/30 px-2 py-0.5 rounded">
            REAL-TIME BUS
          </span>
        </div>

        {/* Grid of 10 Chaos Triggers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* 1: Cold Snap */}
          <button
            onClick={() => triggerFault('Cold Snap', 'temp')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#6ff6ff] truncate">Cold Snap</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">-25°C Arctic</span>
            </div>
            <span className="material-symbols-outlined text-[#00f2fe] text-[18px]">severe_cold</span>
          </button>

          {/* 2: Heat Wave */}
          <button
            onClick={() => triggerFault('Heat Wave', 'temp')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#ffb4ab] truncate">Heat Wave</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">+48°C Desert</span>
            </div>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">sunny</span>
          </button>

          {/* 3: Black Ice */}
          <button
            onClick={() => triggerFault('Black Ice', 'friction')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] truncate">Black Ice</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">μ = 0.15 Friction</span>
            </div>
            <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">device_thermostat</span>
          </button>

          {/* 4: Phantom Obstacle */}
          <button
            onClick={() => triggerFault('Phantom Obstacle', 'lidar')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] truncate">Phantom Obj</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">LIDAR False +</span>
            </div>
            <span className="material-symbols-outlined text-[#4edea3] text-[18px]">visibility_off</span>
          </button>

          {/* 5: Cooling Failure */}
          <button
            onClick={() => triggerFault('Cooling Failure', 'critical')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#ffb4ab] truncate">Cooling Fail</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">Pump Cavitation</span>
            </div>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">power_off</span>
          </button>

          {/* 6: Cell Imbalance */}
          <button
            onClick={() => triggerFault('Cell Imbalance', 'bms')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] truncate">Cell Imbalance</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">ΔV &gt; 380mV</span>
            </div>
            <span className="material-symbols-outlined text-[#00f2fe] text-[18px]">density_medium</span>
          </button>

          {/* 7: Sensor Dropout */}
          <button
            onClick={() => triggerFault('Sensor Dropout', 'bus')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] truncate">Sensor Drop</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">CAN-FD 0x3F2</span>
            </div>
            <span className="material-symbols-outlined text-[#b9cacb] text-[18px]">sensors_off</span>
          </button>

          {/* 8: Regen Failure */}
          <button
            onClick={() => triggerFault('Regen Failure', 'inverter')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] truncate">Regen Failure</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">Inverter Gate Trip</span>
            </div>
            <span className="material-symbols-outlined text-[#ffb95f] text-[18px]">energy_savings_leaf</span>
          </button>

          {/* 9: HVAC Surge */}
          <button
            onClick={() => triggerFault('HVAC Surge', 'drain')}
            className="flex items-center justify-between p-3 rounded bg-[#1d1f27] hover:bg-[#272a32] border border-[#3a494b]/30 transition-colors text-left active:scale-[0.98] cursor-pointer"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] text-[#e1e2ec] truncate">HVAC Surge</span>
              <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">+8.4 kW Parasitic</span>
            </div>
            <span className="material-symbols-outlined text-[#00dce6] text-[18px]">air</span>
          </button>

          {/* 10: Chaos Cocktail */}
          <button
            onClick={triggerCocktail}
            className="flex items-center justify-between p-3 rounded bg-[#00f2fe] hover:bg-[#6ff6ff] text-[#00373a] font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-[#00f2fe]/20"
          >
            <div className="flex flex-col min-w-0 pr-1">
              <span className="font-label-caps text-[11px] truncate">Chaos Cocktail</span>
              <span className="font-telemetry-sm text-[11px] opacity-80">3x Randomized</span>
            </div>
            <span className="material-symbols-outlined text-[18px]">shuffle</span>
          </button>
        </div>

        {/* Reset / Clear Trigger */}
        <div className="pt-1">
          <button
            onClick={clearAllFaults}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-[#32353d] text-[#e1e2ec] font-label-caps text-[11px] hover:bg-[#93000a] hover:text-[#ffdad6] transition-colors border border-[#3a494b]/30 cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            CLEAR ALL SIMULATED PERTURBATIONS
          </button>
        </div>
      </div>

      {/* 3. REAL-TIME FAULT TIMELINE STREAM & RECOVERY BAR */}
      <div className="flex flex-col w-full bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-[20px]">healing</span>
            <h3 className="font-headline-sm text-[18px] text-[#e1e2ec] tracking-tight">
              Recovery &amp; Live Timeline
            </h3>
          </div>
          <span className="font-telemetry-sm text-[12px] text-[#4edea3] bg-[#1d1f27] border border-[#4edea3]/30 px-2 py-0.5 rounded">
            ONLINE
          </span>
        </div>

        {/* Recovery Algorithm Bar */}
        <div className="flex flex-col gap-1.5 p-3 rounded bg-[#0b0e15] border border-[#3a494b]/30">
          <div className="flex justify-between items-center text-[#e1e2ec]">
            <span className="font-label-caps text-[10px] text-[#4edea3]">
              RECOVERY ALGORITHM (KALMAN PID)
            </span>
            <span className="font-telemetry-sm text-[13px] text-[#4edea3] font-bold">
              {state.kalmanRecoveryPercent}% Stabilized
            </span>
          </div>
          <div className="w-full h-2 rounded bg-[#272a32] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded ${
                state.kalmanRecoveryPercent > 70
                  ? 'bg-[#4edea3]'
                  : state.kalmanRecoveryPercent > 50
                  ? 'bg-[#ffb95f]'
                  : 'bg-[#ffb4ab]'
              }`}
              style={{ width: `${state.kalmanRecoveryPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Live Event Feed */}
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto no-scrollbar">
          {state.timelineEvents.map(event => {
            const isCrit = event.severity === 'CRITICAL';
            const isCaution = event.severity === 'CAUTION';
            const isResolved = event.severity === 'RESOLVED';

            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 p-3 rounded border transition-all ${
                  isCrit
                    ? 'bg-[#93000a]/20 border-[#ffb4ab]/30'
                    : isCaution
                    ? 'bg-[#ffd3a1]/10 border-[#ffb95f]/30'
                    : 'bg-[#1d1f27] border-[#3a494b]/30'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    isCrit
                      ? 'bg-[#ffb4ab] text-[#690005]'
                      : isCaution
                      ? 'bg-[#ffb95f]/30 text-[#ffb95f]'
                      : 'bg-[#00a572]/40 text-[#4edea3]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isCrit ? 'warning' : isCaution ? 'tire_repair' : 'check_circle'}
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-label-caps text-[10px] font-bold ${
                        isCrit ? 'text-[#ffb4ab]' : isCaution ? 'text-[#ffb95f]' : 'text-[#4edea3]'
                      }`}
                    >
                      {event.severity}
                    </span>
                    <span className="font-telemetry-sm text-[11px] text-[#b9cacb]">
                      {event.timestamp}
                    </span>
                  </div>
                  <p className="font-body-md text-[13px] text-[#e1e2ec] mt-0.5 leading-snug">
                    {event.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. COPILOT AI MITIGATION STRATEGY */}
      <div className="flex flex-col w-full bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f2fe] animate-ping"></div>
            <span className="font-label-caps text-[11px] text-[#00f2fe] font-bold uppercase tracking-wider">
              AI OPTIMIZING · 2Hz TICK CYCLE
            </span>
          </div>
          <span className="font-telemetry-sm text-[12px] text-[#b9cacb]">CONFIDENCE 94.6%</span>
        </div>

        {/* AI Diagnostic Text Box */}
        <div className="p-3 rounded bg-[#1d1f27] border border-[#3a494b]/30 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[#00f2fe]">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span className="font-label-caps text-[10px] font-bold">INTELLIGENT MITIGATION STRATEGY</span>
          </div>
          <p className="font-body-md text-[13px] text-[#e1e2ec] leading-relaxed">
            “Battery temperature rising faster than dissipation rate on current gradient. Reducing target
            speed to <span className="font-telemetry-sm text-[#00f2fe] font-bold">82 km/h</span> recovers{' '}
            <span className="font-telemetry-sm text-[#4edea3] font-bold">14% SoC</span> and prevents
            forced thermal shutdown in <span className="font-telemetry-sm text-[#ffb4ab] font-bold">4.2 minutes</span>.”
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleApplyStrategy}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded font-label-caps text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-md ${
              strategyApplied
                ? 'bg-[#00a572] text-[#00311f]'
                : 'bg-[#00f2fe] hover:bg-[#6ff6ff] text-[#00373a]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {strategyApplied ? 'done_all' : 'task_alt'}
            </span>
            <span>{strategyApplied ? 'STRATEGY APPLIED' : 'APPLY STRATEGY'}</span>
          </button>

          <button
            onClick={simulateAlternative}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded bg-[#272a32] hover:bg-[#363941] text-[#e1e2ec] border border-[#3a494b]/40 font-label-caps text-[11px] font-bold transition-all cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>SIMULATE ALT</span>
          </button>
        </div>
      </div>

      {/* 5. GLASS-BOX DEEP JSON INSPECTOR */}
      <div className="flex flex-col w-full bg-[#191b23] border border-[#3a494b]/40 rounded-xl p-4 shadow-md gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f2fe] text-[20px]">code_blocks</span>
            <h3 className="font-headline-sm text-[18px] text-[#e1e2ec] tracking-tight">JSON Inspector</h3>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#272a32] hover:bg-[#363941] text-[#00f2fe] font-label-caps text-[10px] transition-colors cursor-pointer border border-[#00f2fe]/20"
          >
            <span className="material-symbols-outlined text-[14px]">content_copy</span>
            <span>{copied ? 'COPIED!' : 'COPY'}</span>
          </button>
        </div>

        {/* Inspector Tabs */}
        <div className="flex items-center gap-1 bg-[#0b0e15] border border-[#3a494b]/40 p-0.5 rounded">
          <button
            onClick={() => setJsonTab('pipeline')}
            className={`flex-1 py-1 rounded font-label-caps text-[11px] text-center font-bold cursor-pointer transition-colors ${
              jsonTab === 'pipeline'
                ? 'bg-[#1d1f27] text-[#00f2fe]'
                : 'text-[#b9cacb] hover:text-[#e1e2ec]'
            }`}
          >
            EVAL_ENVELOPE()
          </button>
          <button
            onClick={() => setJsonTab('raw')}
            className={`flex-1 py-1 rounded font-label-caps text-[11px] text-center cursor-pointer transition-colors ${
              jsonTab === 'raw'
                ? 'bg-[#1d1f27] text-[#00f2fe] font-bold'
                : 'text-[#b9cacb] hover:text-[#e1e2ec]'
            }`}
          >
            RAW_TELEMETRY
          </button>
        </div>

        {/* Monospace Obsidian Payload View */}
        <div className="w-full bg-[#0b0e15] border border-[#3a494b]/30 rounded p-3 overflow-x-auto no-scrollbar font-telemetry-sm text-[12px] leading-relaxed max-h-56">
          <pre className="text-[#6ff6ff]">
            {jsonTab === 'pipeline'
              ? JSON.stringify(evalEnvelopePayload, null, 2)
              : JSON.stringify(rawTelemetryPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
