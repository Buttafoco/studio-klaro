// Tester för kundcase-datamodellen (node --test). Körs med `npm test`.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { validKpis, renderKpis, parseCase } from '../src/proof-kpi.mjs';

const KPI = { value: '+18 %', label: 'Fler bokningar via hemsidan', period: 'jan–mar 2027 jämfört med okt–dec 2026', source: 'Bokadirekt' };

describe('KPI:er visas bara när riktiga värden finns', () => {
  test('tom lista ger ingen KPI-rad', () => {
    assert.deepEqual(validKpis([]), []);
    assert.equal(renderKpis([]), '');
    assert.equal(renderKpis(undefined), '');
  });
  test('alla fyra fält krävs: värde, etikett, mätperiod och källa', () => {
    for (const f of ['value', 'label', 'period', 'source']) {
      const k = { ...KPI }; delete k[f];
      assert.deepEqual(validKpis([k]), [], `saknat fält: ${f}`);
      assert.deepEqual(validKpis([{ ...KPI, [f]: '   ' }]), [], `tomt fält: ${f}`);
    }
  });
  test('giltig KPI renderas med värde, etikett, period och källa', () => {
    const html = renderKpis([KPI]);
    assert.match(html, /\+18 %/);
    assert.match(html, /Fler bokningar via hemsidan/);
    assert.match(html, /jan–mar 2027/);
    assert.match(html, /Källa: Bokadirekt/);
  });
  test('ofullständiga KPI:er filtreras bort, giltiga behålls', () => {
    assert.equal(validKpis([KPI, { value: '12', label: 'x' }]).length, 1);
  });
  test('numeriskt värde godtas', () => {
    assert.equal(validKpis([{ ...KPI, value: 42 }]).length, 1);
  });
  test('HTML escapas', () => {
    const html = renderKpis([{ ...KPI, label: '<script>x</script>' }]);
    assert.ok(!html.includes('<script>'));
    assert.match(html, /&lt;script&gt;/);
  });
});

describe('case-data: publicerat kundprojekt eller koncept', () => {
  test('publicerat case läses in', () => {
    const c = parseCase('{"id":"chairman","status":"published","company":"The Chairman Barber","industry":"Barberare","kpis":[]}');
    assert.equal(c.status, 'published');
    assert.equal(c.company, 'The Chairman Barber');
    assert.deepEqual(c.kpis, []);
  });
  test('okänd eller saknad status blir koncept, aldrig publicerat', () => {
    assert.equal(parseCase('{"id":"x"}').status, 'concept');
    assert.equal(parseCase('{"id":"x","status":"live"}').status, 'concept');
  });
  test('ogiltig JSON ger null', () => {
    assert.equal(parseCase('{inte json'), null);
  });
});
