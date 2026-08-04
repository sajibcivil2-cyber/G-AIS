const fs = require('fs');
let file = fs.readFileSync('src/utils/dseBacktestEngine.ts', 'utf8');

// 1. Fix UNIQUEHRL in DSE_SECTOR_MAP
file = file.replace(/UNIQUEHRL: 'Insurance General',/, "UNIQUEHRL: 'Travel & Leisure',");

// 2. Fix Insurance General heuristic
const oldInsRegex = /if \(\/INS\|INSURANCE\|DELTA\|MEGHNA\|GREEN\|RELIANCE\|ASIA\|BGIC\|PRAGATI\|PROVATI\|REPUBLICA\|NITOL\|SONAR\|UNIQUE\|FAREAST\|FEDERAL\|JANATA\|KARNAPHULI\|PEOPLES\|POPULAR\|RUPALI\|SENAKALYAN\|PRIMEINS\/i\.test\(target\)\) return 'Insurance General';/;
const newInsRegex = "if (/\\bINS\\b|INSURANCE|GREENDELT|RELIANCINS|ASIAINS|BGIC|PRAGATIINS|PROVATIINS|REPUBLICA|NITOLINS|SONARBAINS|FAREASTINS|FEDERALINS|JANATAINS|KARNAPHULI|PEOPLESINS|RUPALIINS|SENAKALYAN|PRIMEINS|CENTRALINS|CONTININS|PARAMOUT|CITYINS|STANDARDIN|AGRANIINS|ASIAPACINS|CRYSTALINS|DHAKAAINS|EXIMINS|GLOBALINS|ISLAMIINS|MERCANINS|PROGRESSIVE|UNIONINS/i.test(target)) return 'Insurance General';";
file = file.replace(oldInsRegex, newInsRegex);

// 3. Fix IT Sector heuristic
const oldItRegex = /if \(\/IT\|TEL\|NET\|TECH\|SYS\|INFO\|CYBER\|SOFTWARE\|COMM\|ADN\|GENEX\|AAMRA\|BDCOM\|AGNI\|INTECH\|E-GEN\/i\.test\(target\)\) return 'IT Sector';/;
const newItRegex = "if (/\\bIT\\b|\\bITC\\b|TECH|CYBER|SOFTWARE|ADN|GENEX|AAMRA|BDCOM|AGNI|INTECH|E-GEN|DAFODILCOM/i.test(target)) return 'IT Sector';";
file = file.replace(oldItRegex, newItRegex);

fs.writeFileSync('src/utils/dseBacktestEngine.ts', file);
console.log("Fixes applied.");
