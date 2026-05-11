"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Leaf, Droplets, Zap, TrendingUp, Download } from "lucide-react";

interface EcgTotals {
  totalMaterialKg: string | null;
  totalCo2Kg: string | null;
  totalWaterL: string | null;
  totalEnergyKwh: string | null;
  totalLandfillKg: string | null;
  totalCarbonCredits: string | null;
}

interface EcgRecord {
  id: string;
  co2SavedKg: number;
  waterSavedL: number;
  energySavedKwh: number;
  materialDivertedKg: number;
  carbonCreditEquivalent: number;
  category: string;
  reportingPeriod: string;
  recordedAt: string;
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

export default function EcgPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [totals, setTotals] = useState<EcgTotals | null>(null);
  const [records, setRecords] = useState<EcgRecord[]>([]);

  useEffect(() => {
    fetch("/api/orgs")
      .then((r) => r.json())
      .then((orgs) => {
        if (!orgs.length) return;
        const org = orgs[0];
        setOrgId(org.id);
        setOrgName(org.name);
        fetch(`/api/ecg?orgId=${org.id}`)
          .then((r) => r.json())
          .then((data) => {
            setTotals(data.totals ?? null);
            setRecords(data.records ?? []);
          });
      });
  }, []);

  const t = {
    co2: parseFloat(totals?.totalCo2Kg ?? "0"),
    material: parseFloat(totals?.totalMaterialKg ?? "0"),
    water: parseFloat(totals?.totalWaterL ?? "0"),
    energy: parseFloat(totals?.totalEnergyKwh ?? "0"),
    landfill: parseFloat(totals?.totalLandfillKg ?? "0"),
    credits: parseFloat(totals?.totalCarbonCredits ?? "0"),
  };

  // Group records by period for chart
  const byPeriod = records.reduce<Record<string, { co2: number; material: number }>>((acc, r) => {
    const p = r.reportingPeriod ?? "Unknown";
    if (!acc[p]) acc[p] = { co2: 0, material: 0 };
    acc[p].co2 += r.co2SavedKg;
    acc[p].material += r.materialDivertedKg;
    return acc;
  }, {});

  const chartData = Object.entries(byPeriod)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, v]) => ({
      period,
      "CO₂ saved (kg)": Math.round(v.co2),
      "Material (kg)": Math.round(v.material),
    }));

  // Category breakdown
  const byCategory = records.reduce<Record<string, number>>((acc, r) => {
    const cat = (r.category ?? "other").replace(/_/g, " ");
    acc[cat] = (acc[cat] ?? 0) + r.materialDivertedKg;
    return acc;
  }, {});

  const categoryData = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value: Math.round(value) }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ECG Impact Report</h1>
          <p className="text-slate-500 text-sm mt-1">
            Environmental, Carbon &amp; Governance metrics for {orgName}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Leaf}
          color="bg-green-100 text-green-600"
          label="CO₂ Saved"
          value={t.co2 >= 1000 ? `${(t.co2 / 1000).toFixed(2)}t` : `${t.co2.toFixed(0)}kg`}
          sub="CO₂ equivalent"
        />
        <StatCard
          icon={TrendingUp}
          color="bg-blue-100 text-blue-600"
          label="Material Diverted"
          value={
            t.material >= 1000
              ? `${(t.material / 1000).toFixed(1)}t`
              : `${t.material.toFixed(0)}kg`
          }
          sub="Kept from landfill"
        />
        <StatCard
          icon={Droplets}
          color="bg-cyan-100 text-cyan-600"
          label="Water Saved"
          value={
            t.water >= 1_000_000
              ? `${(t.water / 1_000_000).toFixed(2)}ML`
              : `${(t.water / 1000).toFixed(0)}kL`
          }
          sub="Litres conserved"
        />
        <StatCard
          icon={Zap}
          color="bg-amber-100 text-amber-600"
          label="Energy Saved"
          value={
            t.energy >= 1000
              ? `${(t.energy / 1000).toFixed(1)}MWh`
              : `${t.energy.toFixed(0)}kWh`
          }
          sub="Kilowatt-hours"
        />
      </div>

      {/* Carbon credit box */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-green-100 text-sm font-medium mb-1">Carbon credit equivalent</p>
          <p className="text-4xl font-bold">{t.credits.toFixed(4)}</p>
          <p className="text-green-100 text-sm mt-1">tCO₂e (1 credit ≈ 1 tonne CO₂)</p>
        </div>
        <Leaf className="w-16 h-16 text-green-300 opacity-50" />
      </div>

      {/* Quarterly chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Impact by quarter</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="CO₂ saved (kg)" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Material (kg)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category breakdown */}
      {categoryData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Material category breakdown (kg)</h2>
          <div className="space-y-3">
            {categoryData.map(({ name, value }) => {
              const max = categoryData[0].value;
              return (
                <div key={name}>
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span className="capitalize">{name}</span>
                    <span className="font-medium">{value.toLocaleString()} kg</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Leaf className="w-10 h-10 mb-3" />
          <p className="text-sm">ECG data will appear here once deals are completed.</p>
        </div>
      )}
    </div>
  );
}
