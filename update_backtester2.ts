import fs from 'fs';

let content = fs.readFileSync('src/components/DseBacktester.tsx', 'utf8');

const oldNav = /\{\/\* Navigation Sub-Header Bar \*\/\}\n[\s\S]*?\{\/\* Loaded Dataset Info & Quick Upload \*\/\}/;

const newNav = `{/* Navigation Sub-Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-2 rounded-2xl shadow-xl backdrop-blur-sm">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto scrollbar-thin pb-1 sm:pb-0">
          <TabButton
            active={activeSubTab === 'screener'}
            onClick={() => setActiveSubTab('screener')}
            icon={<Sparkles className="w-4 h-4" />}
            label="Screener"
          />
          <TabButton
            active={activeSubTab === 'compare'}
            onClick={() => setActiveSubTab('compare')}
            icon={<Scale className="w-4 h-4" />}
            label="Compare"
          />
          <TabButton
            active={activeSubTab === 'chart'}
            onClick={() => setActiveSubTab('chart')}
            icon={<BarChart2 className="w-4 h-4" />}
            label="Chart"
          />
          <TabButton
            active={activeSubTab === 'lab'}
            onClick={() => setActiveSubTab('lab')}
            icon={<Sliders className="w-4 h-4" />}
            label="Strategy Lab"
          />
          <TabButton
            active={activeSubTab === 'edge'}
            onClick={() => setActiveSubTab('edge')}
            icon={<Target className="w-4 h-4" />}
            label="Edge"
          />
          <TabButton
            active={activeSubTab === 'postmortem'}
            onClick={() => setActiveSubTab('postmortem')}
            icon={<ShieldAlert className="w-4 h-4" />}
            label="Post-Mortem"
          />
          <div className="w-px h-6 bg-slate-800 mx-1 shrink-0" />
          <TabButton
            active={false}
            onClick={() => setShowPriceAlertModal(true)}
            icon={<Bell className="w-4 h-4" />}
            label="Alerts"
            badge={priceAlerts.filter(a => !a.isTriggered).length || undefined}
          />
        </div>

        {/* Loaded Dataset Info & Quick Upload */}`;

content = content.replace(oldNav, newNav);

fs.writeFileSync('src/components/DseBacktester.tsx', content);
