"use client";

import React, { useState } from 'react';
import { Sliders, TrendingUp, ShieldCheck, Leaf, DollarSign } from 'lucide-react';

export const ScenarioSimulator: React.FC = () => {
  const [revenuePercent, setRevenuePercent] = useState<number>(10);
  const [expensePercent, setExpensePercent] = useState<number>(-5);
  const [hvacDimming, setHvacDimming] = useState<number>(20);
  const [solarKw, setSolarKw] = useState<number>(5);

  const baselineIncome = 45000;
  const baselineExpenses = 28000;
  const baselineNet = baselineIncome - baselineExpenses;
  const baselineScore = 72;

  // Simulation calculations
  const simIncome = Math.round(baselineIncome * (1 + revenuePercent / 100));
  const energySavings = Math.round((hvacDimming * 120) + (solarKw * 750));
  const rawExpenses = Math.round(baselineExpenses * (1 + expensePercent / 100));
  const simExpenses = Math.max(2000, rawExpenses - energySavings);

  const simNet = simIncome - simExpenses;
  const simScore = Math.max(30, Math.min(98, Math.round(baselineScore + (simNet - baselineNet) / 1000)));

  const co2Offset = Math.round((hvacDimming * 15) + (solarKw * 110));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">AI "What-If" Scenario Simulator</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
          Real-time Engine
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sliders Input Panel */}
        <div className="space-y-5 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Sales Revenue Target (% Change)</span>
              <span className="text-blue-600 font-bold">{revenuePercent > 0 ? `+${revenuePercent}%` : `${revenuePercent}%`}</span>
            </div>
            <input
              type="range"
              min="-30"
              max="50"
              value={revenuePercent}
              onChange={(e) => setRevenuePercent(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Operating Expense Adjustment (%)</span>
              <span className="text-emerald-600 font-bold">{expensePercent > 0 ? `+${expensePercent}%` : `${expensePercent}%`}</span>
            </div>
            <input
              type="range"
              min="-40"
              max="30"
              value={expensePercent}
              onChange={(e) => setExpensePercent(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>HVAC & Energy Power Dimming (%)</span>
              <span className="text-amber-600 font-bold">{hvacDimming}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={hvacDimming}
              onChange={(e) => setHvacDimming(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Solar Capacity Add-on (kW)</span>
              <span className="text-indigo-600 font-bold">+{solarKw} kW</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={solarKw}
              onChange={(e) => setSolarKw(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        {/* Side-by-Side Results Display */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
              <span className="text-xs text-slate-500 block mb-1">Baseline Trajectory</span>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">Rs. {baselineNet.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Risk Score: <span className="font-bold">{baselineScore}</span></div>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold block mb-1">Simulated Trajectory</span>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">Rs. {simNet.toLocaleString()}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Simulated Score: <span className="font-bold">{simScore}</span></div>
            </div>
          </div>

          {/* Environmental Offset Highlights */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Green Offset Projections</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Carbon Savings: <strong>{co2Offset} kg CO2 / Month</strong>
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Monthly Savings</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rs. {energySavings.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
