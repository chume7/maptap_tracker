const { parseMapTapMessage } = require('../src/parser');

const sample = `April 14
94🏅 93🏆 90👑 93🏆 60😐
Final score: 826`;

const parsed = parseMapTapMessage(sample);
console.log('Input:\n');
console.log(sample);
console.log('\nParsed output:\n');
console.log(parsed);

if (!parsed || parsed.finalScore !== 826 || parsed.round5 !== 60) {
  console.error('\nParser test failed.');
  process.exit(1);
}

console.log('\nParser test passed.');
