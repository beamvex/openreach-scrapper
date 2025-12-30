import { parse } from 'node-html-parser';

export function parseResults(html: string): string {
  const doc = parse(html);
  const result = doc.querySelector('p.status-label');
  return result?.textContent ?? '';
}
