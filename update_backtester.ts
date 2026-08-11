import fs from 'fs';

let content = fs.readFileSync('src/components/DseBacktester.tsx', 'utf8');

content = content.replace(/SectorMomentumStat } from '\.\.\/types';/, "SectorMomentumStat } from '../types';");

// find `topSectorMomentum` useMemo and replace it and add sectorMomentum calculation.
const oldMomentum = /\/\/ Compute sector with highest volume momentum[\s\S]*?return null;\n  \}, \[activeStockPool\]\);/;

const newMomentum = `// Per-sector volume momentum, computed once against the full active pool (not the
  // sector-filtered view) so it reflects true market-wide rotation. Feeds directly into
  // the screener's scoring — a stock's early move is more credible when its whole sector
  // is accelerating.
  const sectorMomentum: Record<string, SectorMomentumStat> = useMemo(() => computeSectorMomentum(activeStockPool), [activeStockPool]);

  const topSectorMomentum = useMemo(() => {
    const entries: SectorMomentumStat[] = Object.values(sectorMomentum).filter((s) => s.momentumPct > 0);
    if (entries.length === 0) return null;
    const top = entries.reduce((best, cur) => (cur.momentumPct > best.momentumPct ? cur : best));
    return { sector: top.sector, increasePct: top.momentumPct };
  }, [sectorMomentum]);`;

content = content.replace(oldMomentum, newMomentum);

// Add TabButton
const tabButtonComp = `const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className={\`relative shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 \${
      active
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
    }\`}
  >
    <span className={active ? 'text-emerald-200' : 'text-slate-500'}>{icon}</span>
    <span className="whitespace-nowrap">{label}</span>
    {badge !== undefined && (
      <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const KpiCard`;

content = content.replace('const KpiCard', tabButtonComp);

// Update DseStockScreener props in DseBacktester
content = content.replace(/edgeStats=\{edgeStats\}/, "edgeStats={edgeStats}\n          sectorMomentum={sectorMomentum}");

fs.writeFileSync('src/components/DseBacktester.tsx', content);
