import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { BatteryCell } from '../types/telemetry';

export const FullCellMatrixModal: React.FC = () => {
  const {
    state,
    selectedCell,
    setSelectedCell,
    isCellMatrixModalOpen,
    setIsCellMatrixModalOpen,
  } = useTelemetry();

  const [filter, setFilter] = useState<'all' | 'hotspots' | 'imbalanced'>('all');

  if (!isCellMatrixModalOpen) return null;

  const filteredCells = state.cells.filter(cell => {
    if (filter === 'hotspots') return cell.isHotspot || cell.temp >= 42.0;
    if (filter === 'imbalanced') return Math.abs(cell.voltage - state.minCellVoltage) > 0.015;
    return true;
  });

  const activeInspectCell: BatteryCell = selectedCell || state.cells.find(c => c.isHotspot) || state.cells[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-[#191b23] border border-[#3a494b]/60 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#3a494b]/40 bg-[#1d1f27]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00f2fe] text-[22px]">grid_view</span>
            <div>
              <h3 className="font-headline-sm text-[16px] sm:text-[18px] text-[#e1e2ec] leading-tight">
                96-Cell Pack Matrix Deep Inspector
              </h3>
              <span className="font-label-caps text-[10px] text-[#b9cacb]">
                12×8 Series Architecture • Thermistor &amp; Voltage Shunts
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCellMatrixModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[#272a32] hover:bg-[#363941] text-[#b9cacb] hover:text-[#e1e2ec] flex items-center justify-center cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          {/* Top Filter & Status Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0b0e15] border border-[#3a494b]/30 p-2.5 rounded-xl">
            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded font-label-caps text-[10px] uppercase transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#00f2fe] text-[#00373a] font-bold'
                    : 'text-[#b9cacb] hover:text-[#e1e2ec]'
                }`}
              >
                All 96 Cells
              </button>
              <button
                onClick={() => setFilter('hotspots')}
                className={`px-3 py-1 rounded font-label-caps text-[10px] uppercase transition-colors cursor-pointer ${
                  filter === 'hotspots'
                    ? 'bg-[#ffb4ab] text-[#690005] font-bold'
                    : 'text-[#b9cacb] hover:text-[#e1e2ec]'
                }`}
              >
                Hotspots (≥42°C)
              </button>
              <button
                onClick={() => setFilter('imbalanced')}
                className={`px-3 py-1 rounded font-label-caps text-[10px] uppercase transition-colors cursor-pointer ${
                  filter === 'imbalanced'
                    ? 'bg-[#ffb95f] text-[#472a00] font-bold'
                    : 'text-[#b9cacb] hover:text-[#e1e2ec]'
                }`}
              >
                Imbalance (&gt;15mV)
              </button>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-3 font-label-caps text-[10px] text-[#b9cacb]">
              <span>Min: <strong className="text-[#4edea3]">{state.minCellVoltage}V</strong></span>
              <span>Max: <strong className="text-[#ffb95f]">{state.maxCellVoltage}V</strong></span>
              <span>Δ Spread: <strong className="text-[#e1e2ec]">{state.cellSpreadDeltaV}V</strong></span>
            </div>
          </div>

          {/* 12 x 8 Visual Matrix Grid */}
          <div className="flex flex-col gap-2">
            <span className="font-label-caps text-[10px] text-[#b9cacb] uppercase">
              Physical Cell Topology (Click any cell to inspect)
            </span>

            <div className="bg-[#0b0e15] border border-[#3a494b]/40 p-3 rounded-xl overflow-x-auto no-scrollbar">
              <div className="grid grid-cols-12 gap-1.5 min-w-[500px]">
                {state.cells.map(cell => {
                  const isSelected = activeInspectCell.id === cell.id;
                  let colorBg = 'bg-[#00f2fe]/80';
                  if (cell.temp >= 45.0) {
                    colorBg = 'bg-[#ffb4ab] animate-pulse';
                  } else if (cell.temp >= 41.0) {
                    colorBg = 'bg-[#ffb95f]';
                  }

                  return (
                    <button
                      key={cell.id}
                      onClick={() => setSelectedCell(cell)}
                      className={`h-7 rounded flex flex-col items-center justify-center font-telemetry-sm text-[9px] font-bold transition-all cursor-pointer relative ${colorBg} ${
                        isSelected
                          ? 'ring-2 ring-white scale-105 z-10 text-[#00373a]'
                          : 'text-[#002022] hover:opacity-90'
                      }`}
                    >
                      <span>{cell.id}</span>
                      <span className="text-[7px] leading-none opacity-80">{cell.temp}°</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Cell Deep Inspector Card */}
          <div className="bg-[#1d1f27] border border-[#00f2fe]/40 rounded-xl p-4 shadow-md flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#3a494b]/30">
              <div className="flex items-center gap-2">
                <span className="font-label-caps text-[11px] text-[#00f2fe] uppercase font-bold">
                  Cell #{activeInspectCell.id} Diagnostics
                </span>
                <span className="font-label-caps text-[10px] px-2 py-0.2 rounded bg-[#0b0e15] text-[#b9cacb] border border-[#3a494b]/40">
                  MODULE #{activeInspectCell.module} (Row {activeInspectCell.row + 1}, Col {activeInspectCell.col + 1})
                </span>
              </div>

              <span
                className={`px-2 py-0.5 rounded font-label-caps text-[10px] uppercase font-bold ${
                  activeInspectCell.isHotspot
                    ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ffb4ab]/40'
                    : 'bg-[#00a572]/20 text-[#4edea3] border border-[#4edea3]/30'
                }`}
              >
                {activeInspectCell.isHotspot ? 'HOTSPOT CRITICAL' : 'THERMAL NOMINAL'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0b0e15] border border-[#3a494b]/30 p-2.5 rounded-lg">
                <span className="font-label-caps text-[9px] text-[#b9cacb] block">CELL VOLTAGE</span>
                <span className="font-telemetry-md text-[18px] text-[#e1e2ec] font-bold mt-1 block">
                  {activeInspectCell.voltage} V
                </span>
                <span className="font-body-sm text-[9px] text-[#4edea3]">Δ: +0.012V of avg</span>
              </div>

              <div className="bg-[#0b0e15] border border-[#3a494b]/30 p-2.5 rounded-lg">
                <span className="font-label-caps text-[9px] text-[#b9cacb] block">THERMISTOR TEMP</span>
                <span
                  className={`font-telemetry-md text-[18px] font-bold mt-1 block ${
                    activeInspectCell.temp >= 45 ? 'text-[#ffb4ab]' : activeInspectCell.temp >= 41 ? 'text-[#ffb95f]' : 'text-[#00f2fe]'
                  }`}
                >
                  {activeInspectCell.temp} °C
                </span>
                <span className="font-body-sm text-[9px] text-[#b9cacb]">Trip @ 45.0°C</span>
              </div>

              <div className="bg-[#0b0e15] border border-[#3a494b]/30 p-2.5 rounded-lg">
                <span className="font-label-caps text-[9px] text-[#b9cacb] block">INTERNAL RESISTANCE</span>
                <span className="font-telemetry-md text-[18px] text-[#6ff6ff] font-bold mt-1 block">
                  {activeInspectCell.internalResistance} mΩ
                </span>
                <span className="font-body-sm text-[9px] text-[#4edea3]">Healthy &lt; 2.5mΩ</span>
              </div>

              <div className="bg-[#0b0e15] border border-[#3a494b]/30 p-2.5 rounded-lg">
                <span className="font-label-caps text-[9px] text-[#b9cacb] block">BALANCING SHUNT</span>
                <span className="font-telemetry-md text-[18px] text-[#4edea3] font-bold mt-1 block">
                  {activeInspectCell.balanceActive ? 'ACTIVE' : 'IDLE'}
                </span>
                <span className="font-body-sm text-[9px] text-[#b9cacb]">Bleed: 120mA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-[#3a494b]/40 bg-[#1d1f27] flex items-center justify-between">
          <span className="font-label-caps text-[10px] text-[#b9cacb]">
            Showing {filteredCells.length} of 96 Battery Pack Cells
          </span>
          <button
            onClick={() => setIsCellMatrixModalOpen(false)}
            className="px-4 py-1.5 rounded bg-[#00f2fe] hover:bg-[#6ff6ff] text-[#00373a] font-label-caps text-[11px] font-bold uppercase transition-all cursor-pointer active:scale-95 shadow-md"
          >
            Close Matrix View
          </button>
        </div>
      </div>
    </div>
  );
};
