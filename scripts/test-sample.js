import { parseMapTapMessage } from '../src/parser.js';

const sample = `April 14
94🏅 93🏆 90👑 93🏆 60😐
Final score: 826`;

const parsed = parseMapTapMessage(sample);
console.log('Sample input:\n');
console.log(sample);
console.log('\nParsed output:\n');
console.log(JSON.stringify(parsed, null, 2));
