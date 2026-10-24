import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { PresetType, TabType } from '../types/telemetry';

const TAB_TITLES: Record<TabType, string> = {
  'hud-vehicle-stage': 'Hud Vehicle Stage',
  'battery-strain-telemetry': 'Battery Strain Telemetry',
  'digital-twin-radar': 'Digital Twin Radar',
  'chaos-injection-alerts': 'Chaos Injection Alerts',
  'copilot-ai-json-inspector': 'Copilot AI Inspector',
};

const PRESETS: PresetType[] = ['ALPHA_WLTP', 'EXTREME_ALPINE', 'DESERT_TEST', 'NURBURGRING_LAP'];

export const Header: React.FC = () => {
  const { state, currentTab, setCurrentTab, setMultiplier, setPreset, setIsProfileModalOpen } = useTelemetry();
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const activeTitle = TAB_TITLES[currentTab];
  const tickLabel = state.isPlaying
    ? `${state.multiplier * 2}Hz TICK`
    : 'PAUSED';

  return (
    <header className="fixed top-0 w-full z-40 bg-[#10131a]/90 backdrop-blur-xl border-b border-[#3a494b]/30 shadow-[0_1px_16px_rgba(0,242,254,0.06)] pt-safe">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col gap-2">
        {/* Row 1: Brand Wordmark, Title, Status & Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Telemetry Emblem */}
            {!imgError ? (
              <img
                alt="EV Intelligence Telemetry Emblem"
                className="h-8 w-8 object-contain rounded"
                src="https://lh3.googleusercontent.com/aida/AEtjO1WoFiW6rtSjSD_m2iyq9Sga0Sr94lnAJai7JZUyJ48G9l9HrtrH37q15xjRl3K4SM8m-33KgCosYfqZ-VAc0R1NWh3CM5ROtCv_MvddeqiG5BpNx7V1C_EpRE8ldm5FNEl8ROdW685-r1_UGmxIQ6dExtKd3k-7tR08gnzkuhKQmozBQNUpzYQsFPxaZ0ButlfaT3EJg_WGcwAord4zlezm1jV_pNCcDyR7p5ntUBObrNDYRNj406Hl3B5L"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="h-8 w-8 rounded bg-[#191b23] border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </div>
            )}

            <div className="flex flex-col">
              <span className="font-label-caps text-[10px] text-[#00f2fe] tracking-widest uppercase">
                EV TELEMETRY LAB
              </span>
              <span className="font-headline-sm text-[16px] sm:text-[18px] text-[#e1e2ec] tracking-tight leading-none">
                {activeTitle}
              </span>
            </div>
          </div>

          {/* Desktop Tab Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#0b0e15]/80 p-1 rounded-lg border border-[#3a494b]/40">
            {([
              { id: 'hud-vehicle-stage', label: 'HUD Stage', icon: 'speed', badge: undefined },
              { id: 'battery-strain-telemetry', label: 'Strain', icon: 'battery_charging_full', badge: undefined },
              { id: 'digital-twin-radar', label: 'Twin Radar', icon: 'radar', badge: undefined },
              { id: 'chaos-injection-alerts', label: 'Chaos', icon: 'warning', badge: state.activeFaults.length > 0 ? state.activeFaults.length : undefined },
              { id: 'copilot-ai-json-inspector', label: 'Copilot', icon: 'terminal', badge: undefined },
            ] as { id: TabType; label: string; icon: string; badge?: number }[]).map(item => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`px-3 py-1 rounded font-label-caps text-[11px] uppercase flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[#00f2fe] text-[#00373a] font-bold shadow-md shadow-[#00f2fe]/20'
                      : 'text-[#b9cacb] hover:text-[#e1e2ec] hover:bg-[#191b23]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="w-4 h-4 rounded-full bg-[#93000a] text-[#ffdad6] text-[9px] flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Link Status & Profile Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#272a32]/60 border border-[#3a494b]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
              <span className="font-label-caps text-[10px] text-[#4edea3] uppercase">LINK ACTIVE</span>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              title="EV Telemetry Lab Profile & Bus Info"
              className="w-8 h-8 rounded-full bg-[#e0fdff] hover:bg-[#00f2fe] transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[#00373a] text-[18px]">person</span>
            </button>
          </div>
        </div>

        {/* Row 2: Status chips & Simulation Controls */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 rounded bg-[#272a32] font-label-caps text-[10px] text-[#4edea3] flex items-center gap-1 border border-[#3a494b]/30">
              <span className="w-1 h-1 rounded-full bg-[#4edea3]"></span>
              READY
            </span>

            <span className="px-1.5 py-0.5 rounded bg-[#272a32] font-label-caps text-[10px] text-[#b9cacb] border border-[#3a494b]/30">
              {tickLabel}
            </span>

            {/* Preset Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                className="px-1.5 py-0.5 rounded bg-[#272a32] hover:bg-[#32353d] font-label-caps text-[10px] text-[#00f2fe] flex items-center gap-1 border border-[#00f2fe]/30 cursor-pointer transition-colors"
              >
                <span>PRESET: {state.preset}</span>
                <span className="material-symbols-outlined text-[12px]">expand_more</span>
              </button>

              {isPresetMenuOpen && (
                <div className="absolute left-0 top-full mt-1 bg-[#191b23] border border-[#3a494b] rounded-lg shadow-2xl py-1 z-50 w-48">
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setPreset(p);
                        setIsPresetMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 font-label-caps text-[10px] transition-colors flex items-center justify-between ${
                        state.preset === p
                          ? 'text-[#00f2fe] bg-[#00f2fe]/10 font-bold'
                          : 'text-[#e1e2ec] hover:bg-[#272a32]'
                      }`}
                    >
                      <span>{p}</span>
                      {state.preset === p && (
                        <span className="material-symbols-outlined text-[14px]">check</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 bg-[#0b0e15]/90 p-0.5 rounded border border-[#3a494b]/40 shrink-0">
            {([1, 4, 10] as const).map(speed => (
              <button
                key={speed}
                onClick={() => setMultiplier(speed)}
                className={`px-2 py-0.5 font-label-caps text-[10px] rounded transition-all min-h-[22px] ${
                  state.multiplier === speed
                    ? 'bg-[#00f2fe] text-[#00373a] font-bold shadow-sm'
                    : 'text-[#b9cacb] hover:text-[#e1e2ec]'
                }`}
              >
                {speed}X
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
