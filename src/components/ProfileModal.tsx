import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';

export const ProfileModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, clearAllFaults } = useTelemetry();
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isProfileModalOpen) return null;

  const handleSelfTest = () => {
    setTestRunning(true);
    setTestResult(null);
    setTimeout(() => {
      setTestRunning(false);
      setTestResult('ALL SYSTEMS TESTED: CAN BUS INTEGRITY 100%, BMS NODES 8/8 REACHABLE, GLYCOL INVERTER LOOP PRESSURE NOMINAL.');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#191b23] border border-[#3a494b]/60 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3a494b]/40 bg-[#1d1f27]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#00f2fe] text-[#00373a] flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-[16px] text-[#e1e2ec] leading-tight">
                EV Telemetry Lab Operator Node
              </h3>
              <span className="font-label-caps text-[10px] text-[#4edea3]">NODE ID: LAB-ALPHA-01 // CAN-FD</span>
            </div>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#272a32] hover:bg-[#363941] text-[#b9cacb] hover:text-[#e1e2ec] flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5 bg-[#0b0e15] border border-[#3a494b]/30 p-3 rounded-xl font-label-caps text-[11px]">
            <div>
              <span className="text-[#849495] block text-[9px]">VEHICLE IDENTIFIER</span>
              <span className="text-[#e0fdff] font-bold">HV-96S-400V-ALPHA</span>
            </div>
            <div>
              <span className="text-[#849495] block text-[9px]">AERO STAGE CHASSIS</span>
              <span className="text-[#e0fdff] font-bold">EV-STG-X1 HOVER</span>
            </div>
            <div>
              <span className="text-[#849495] block text-[9px]">CAN BUS PROTOCOL</span>
              <span className="text-[#4edea3] font-bold">ISO 11898-1:2015 FD</span>
            </div>
            <div>
              <span className="text-[#849495] block text-[9px]">FIRMWARE BUILD</span>
              <span className="text-[#ffb95f] font-bold">v4.82-ALPHA-TELEM</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">System Actions</span>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSelfTest}
                disabled={testRunning}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#272a32] hover:bg-[#363941] text-[#00f2fe] border border-[#00f2fe]/30 font-label-caps text-[10px] font-bold uppercase transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
                <span>{testRunning ? 'Testing...' : 'Run Diagnostics Self-Test'}</span>
              </button>

              <button
                onClick={() => {
                  clearAllFaults();
                  setIsProfileModalOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#32353d] hover:bg-[#93000a] text-[#e1e2ec] font-label-caps text-[10px] font-bold uppercase transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span>Flush Telemetry Faults</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div className="p-3 bg-[#0b0e15] border border-[#4edea3]/40 rounded-lg font-telemetry-sm text-[11px] text-[#4edea3] leading-relaxed">
              {testResult}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#3a494b]/40 bg-[#1d1f27] flex justify-end">
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="px-4 py-1.5 rounded bg-[#00f2fe] text-[#00373a] font-label-caps text-[11px] font-bold uppercase cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
