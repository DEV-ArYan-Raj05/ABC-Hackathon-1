import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { TabType } from '../types/telemetry';

interface NavItem {
  id: TabType;
  label: string;
  icon: string;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, state } = useTelemetry();

  const navItems: NavItem[] = [
    { id: 'hud-vehicle-stage', label: 'HUD Stage', icon: 'speed' },
    { id: 'battery-strain-telemetry', label: 'Strain', icon: 'battery_charging_full' },
    { id: 'digital-twin-radar', label: 'Twin Radar', icon: 'radar' },
    {
      id: 'chaos-injection-alerts',
      label: 'Chaos',
      icon: 'warning',
      badge: state.activeFaults.length > 0 ? state.activeFaults.length : undefined,
    },
    { id: 'copilot-ai-json-inspector', label: 'Copilot', icon: 'terminal' },
  ];

  return (
    <nav
      className="fixed bottom-0 w-full z-40 pb-safe bg-[#10131a]/95 backdrop-blur-xl border-t border-[#3a494b]/40 shadow-[0_-2px_16px_rgba(0,0,0,0.6)]"
      data-active-classes="text-[#00f2fe] bg-[#272a32]/80"
    >
      <div className="max-w-md md:max-w-xl mx-auto flex justify-between items-center h-16 px-1">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[44px] px-1 py-1 rounded transition-colors flex-1 ${
                isActive
                  ? 'text-[#00f2fe] bg-[#272a32]/80 font-semibold'
                  : 'text-[#b9cacb] hover:text-[#e1e2ec]'
              }`}
            >
              <div className="relative">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.badge ? (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-[#93000a] text-[#ffdad6] text-[8px] flex items-center justify-center font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="font-label-caps text-[9px] uppercase tracking-normal mt-0.5 truncate max-w-[70px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
