const fs = require('fs');

const version = `reserva-iguacu-v${Date.now()}`;
const swPath = './sw.js';

let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/reserva-iguacu-v[\w-]+/, version);
fs.writeFileSync(swPath, sw);

console.log(`SW cache atualizado: ${version}`);
