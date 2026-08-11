import fs from 'fs';

let content = fs.readFileSync('src/components/DseBacktester.tsx', 'utf8');

content = content.replace(
  /import \{ DseStockData, DseStockCandle, BacktestConfig, BacktestSummary, BreakoutSignal, ExtractedFile \} from '\.\.\/types';/,
  "import { DseStockData, DseStockCandle, BacktestConfig, BacktestSummary, BreakoutSignal, ExtractedFile, SectorMomentumStat } from '../types';"
);

content = content.replace(
  /  computeEquityCurve\n\} from '\.\.\/utils\/dseBacktestEngine';/,
  "  computeEquityCurve,\n  computeSectorMomentum\n} from '../utils/dseBacktestEngine';"
);

fs.writeFileSync('src/components/DseBacktester.tsx', content);
