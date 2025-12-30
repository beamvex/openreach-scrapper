import { parseResults } from './parseResults';
import fs from 'fs';

describe('Parse Results', () => {
  it('Parses Results', () => {
    const html = fs.readFileSync(
      './assets/1_Back_Lane_Dunston_Lincoln_LN4_2EH_United_Kingdom-2025-12-23T16-18-34-587Z.html',
      'utf-8'
    );
    const result = parseResults(html);
    expect(result).toBe('result');
  });
});
