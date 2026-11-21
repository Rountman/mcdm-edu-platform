// Numerická shoda s původním Python backendem. Fixtures generuje
// scripts/generate_fixtures.py (spouští skutečné FastAPI endpointy přes TestClient).
import { describe, expect, it } from 'vitest';
import { McdmError } from '../common';
import { computeAhpFull, type AHPFullRequest } from '../ahp';
import { calculatePaprika, type PAPRIKARequest } from '../paprika';
import { calculateSmart, type SMARTRequest } from '../smart';
import { expectClose } from './helpers';

interface FixtureCase<Req> { name: string; request: Req; status: number; response: unknown }
interface Fixtures {
  versions: Record<string, string>;
  ahp_full: FixtureCase<AHPFullRequest>[];
  smart: FixtureCase<SMARTRequest>[];
  paprika: FixtureCase<PAPRIKARequest>[];
}

const found = import.meta.glob<Fixtures>('../__fixtures__/backend.json', { eager: true, import: 'default' });
const fixtures = Object.values(found)[0];

it('fixtures z Python backendu existují', () => {
  expect(
    fixtures,
    'Chybí src/lib/mcdm/__fixtures__/backend.json – spusťte z kořene repa: python scripts/generate_fixtures.py',
  ).toBeDefined();
});

function check<Req>(cases: FixtureCase<Req>[], fn: (r: Req) => unknown) {
  for (const c of cases) {
    it(`${c.name} (HTTP ${c.status})`, () => {
      if (c.status === 200) {
        expectClose(fn(c.request), c.response);
      } else if (c.status === 422) {
        expect(() => fn(c.request)).toThrow(McdmError);
        try { fn(c.request); } catch (e) { expect((e as McdmError).detail).toBe((c.response as { detail: string }).detail); }
      } else {
        expect(() => fn(c.request)).toThrow();
      }
    });
  }
}

if (fixtures) {
  describe(`shoda s backendem ${JSON.stringify(fixtures.versions)}`, () => {
    describe('AHP full', () => check(fixtures.ahp_full, computeAhpFull));
    describe('SMART', () => check(fixtures.smart, calculateSmart));
    describe('PAPRIKA', () => check(fixtures.paprika, calculatePaprika));
  });
}
