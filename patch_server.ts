import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Initialize Gemini AI SDK lazily[\s\S]*?(?=\/\/ BD Share Live Data Sync Endpoint)/;
content = content.replace(regex, '');
fs.writeFileSync('server.ts', content);
