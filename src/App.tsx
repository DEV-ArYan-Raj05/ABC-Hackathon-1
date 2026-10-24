/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HudVehicleStageView } from './views/HudVehicleStageView';
import { BatteryStrainView } from './views/BatteryStrainView';
import { DigitalTwinRadarView } from './views/DigitalTwinRadarView';
import { ChaosInjectionView } from './views/ChaosInjectionView';
import { CopilotAiView } from './views/CopilotAiView';
import { FullCellMatrixModal } from './components/FullCellMatrixModal';
import { ProfileModal } from './components/ProfileModal';

const AppContent: React.FC = () => {
  const { currentTab } = useTelemetry();

  return (
    <div className="min-h-screen bg-[#10131a] text-[#e1e2ec] flex flex-col relative selection:bg-[#00f2fe]/30 selection:text-white">
      {/* Fixed High-Tech Cockpit Header */}
      <Header />

      {/* Main Screen Content Viewport */}
      <main className="flex-1 w-full pt-24 sm:pt-28 pb-24 transition-opacity duration-300">
        {currentTab === 'hud-vehicle-stage' && <HudVehicleStageView />}
        {currentTab === 'battery-strain-telemetry' && <BatteryStrainView />}
        {currentTab === 'digital-twin-radar' && <DigitalTwinRadarView />}
        {currentTab === 'chaos-injection-alerts' && <ChaosInjectionView />}
        {currentTab === 'copilot-ai-json-inspector' && <CopilotAiView />}
      </main>

      {/* Fixed Bottom Navigation HUD */}
      <BottomNav />

      {/* Deep Inspection Modals */}
      <FullCellMatrixModal />
      <ProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <TelemetryProvider>
      <AppContent />
    </TelemetryProvider>
  );
}
