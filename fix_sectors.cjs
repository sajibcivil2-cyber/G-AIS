const fs = require('fs');

let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

file = file.replace(/return 'Insurance'/g, "return 'Insurance General'");
file = file.replace(/GREENDELT: 'Insurance'/, "GREENDELT: 'Insurance General'");
file = file.replace(/: 'Insurance'/g, ": 'Insurance General'");

// Fix Life Insurance
file = file.replace(/DELTALIFE: 'Insurance General'/g, "DELTALIFE: 'Insurance Life'");
file = file.replace(/MEGHNALIFE: 'Insurance General'/g, "MEGHNALIFE: 'Insurance Life'");
file = file.replace(/NATLIFEINS: 'Insurance General'/g, "NATLIFEINS: 'Insurance Life'");
file = file.replace(/POPULARLIF: 'Insurance General'/g, "POPULARLIF: 'Insurance Life'");
file = file.replace(/SANDHANI: 'Insurance General'/g, "SANDHANI: 'Insurance Life'");
file = file.replace(/SONARLIFE: 'Insurance General'/g, "SONARLIFE: 'Insurance Life'");
file = file.replace(/SUNLIFEINS: 'Insurance General'/g, "SUNLIFEINS: 'Insurance Life'");

// Regex fix
file = file.replace(/if \(\/INS\|INSURANCE\|LIFE\|DELTA\|MEGHNA\|GREEN\|RELIANCE\|ASIA\|BGIC\|PRAGATI\|PROVATI\|REPUBLICA\|NITOL\|SONAR\|SUNLIFE\|UNIQUE\|FAREAST\|FEDERAL\|JANATA\|KARNAPHULI\|PEOPLES\|POPULAR\|RUPALI\|SANDHANI\|SENAKALYAN\|PRIMEINS\/i\.test\(target\)\) return 'Insurance General';/, "if (/LIFE|SANDHANI/i.test(target)) return 'Insurance Life';\n  if (/INS|INSURANCE|DELTA|MEGHNA|GREEN|RELIANCE|ASIA|BGIC|PRAGATI|PROVATI|REPUBLICA|NITOL|SONAR|UNIQUE|FAREAST|FEDERAL|JANATA|KARNAPHULI|PEOPLES|POPULAR|RUPALI|SENAKALYAN|PRIMEINS/i.test(target)) return 'Insurance General';");

fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
