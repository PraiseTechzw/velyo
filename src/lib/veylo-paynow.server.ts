import { createHash, timingSafeEqual } from 'node:crypto';

export function paynowHash(values: string[], integrationKey: string) {
  return createHash('sha512').update(values.join('') + integrationKey, 'utf8').digest('hex').toUpperCase();
}

export function validatePaynowMessage(params: URLSearchParams, integrationKey: string) {
  const received = params.get('hash')?.toUpperCase() ?? '';
  const values = [...params.entries()].filter(([name]) => name.toLowerCase() !== 'hash').map(([, value]) => value);
  const expected = paynowHash(values, integrationKey);
  const a = Buffer.from(received, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parsePaynowResponse(text: string) {
  const parsed = new URLSearchParams();
  for (const [name, value] of new URLSearchParams(text.trim())) parsed.append(name.toLowerCase(), value);
  return parsed;
}

