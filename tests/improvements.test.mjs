import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyze,demo} from '../engine.mjs';
import {compareReports} from '../comparison.mjs';

test('a one-second capture with a shorter retained FFT block withholds spectrum',()=>{
  const r=analyze(demo('hum',{fs:1500,n:1501}));
  assert.ok(r.duration>=1);
  assert.equal(r.evidence[3].value,null);
  assert.equal(r.spectrum.length,0);
  assert.ok(r.findings.some(f=>f.id==='spectrum-unavailable'));
  assert.equal(r.spectralWindow.candidateSamples,1024);
});
test('FFT bin-spacing boundary tolerates timestamp rounding and exposes coverage',()=>{
  const valid=analyze(demo('hum',{fs:1024,n:1025}));
  assert.ok(valid.spectrum.length>0);
  assert.ok(Math.abs(valid.spectralWindow.binSpacingHz-1)<1e-9);
  assert.equal(valid.spectralWindow.samples,1024);
  assert.ok(valid.spectralWindow.coveragePct<100);
  const r=analyze(demo('hum'));
  assert.equal(r.spectralWindow.samples,512);
  assert.equal(r.spectralWindow.coveragePct,51.2);
  assert.match(r.evidence[3].method,/first 512 of 1000/);
});
test('comparison quantifies hum-to-reference change without inventing a repair',()=>{
  const before=analyze(demo('hum')),after=analyze(demo('healthy'));
  const r=compareReports(before,after),band=r.evidence.find(e=>e.id==='E4');
  assert.ok(band.delta < -70);
  assert.equal(band.delta,band.after-band.before);
  assert.deepEqual(r.cleared,['hum']);
  assert.deepEqual(r.added,[]);
  assert.match(r.notice,/do not prove a repair/);
});
test('comparison preserves unavailable values instead of treating them as zero',()=>{
  const before=analyze(demo('hum')),after=analyze(demo('flat'));
  const r=compareReports(before,after);
  assert.equal(r.evidence.find(e=>e.id==='E4').delta,null);
  assert.deepEqual(r.added,['flat']);
});
test('comparison rejects mismatched rails, sample rates, and sample counts',()=>{
  const r=analyze(demo());
  assert.throws(()=>compareReports(r,analyze(demo(),{railMax:5})),/ADC rails/);
  assert.throws(()=>compareReports(r,analyze(demo('healthy',{fs:500}))),/sample rates/);
  assert.throws(()=>compareReports(r,analyze(demo('healthy',{n:900}))),/sample count/);
});
