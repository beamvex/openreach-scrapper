import { parseResults } from './parseResults';

describe('Parse Results', () => {
  it('Parses Results', () => {
    const html = '';
    const result = parseResults(html);
    expect(result).toBe('result');
  });
});
