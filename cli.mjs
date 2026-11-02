#!/usr/bin/env node
// SignalProof Bench Inspector — zero-dependency CLI
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { analyze, demo, parseCSV } from './engine.mjs';
import { explain } from './api/analyze.mjs';
const VALID_KINDS = ['healthy','hum','clipping','gaps','flat'];
const VALID_LANGS = ['en','id'];
function printHelp() {
  console.log(`SignalProof Bench Inspector — zero-dependency CLI

Usage:
  node cli.mjs --demo <healthy|hum|clipping|gaps|flat> [--fs 250] [--rail-min 0] [--rail-max 3.3] [--explain] [--lang en|id] [--json]
  node cli.mjs --file <path.csv> [--rail-min 0] [--rail-max 3.3] [--explain] [--lang en|id] [--json]

Options:
  --demo <kind>     Synthetic preset: healthy | hum | clipping | gaps | flat
  --file <path>     Path to CSV capture (header time_s,value)
  --fs <number>     Sample rate for demo (default 250, only with --demo)
  --rail-min <num>  ADC rail minimum (default 0)
  --rail-max <num>  ADC rail maximum (default 3.3)
  --explain         Request live Meta Muse Spark Open explanation (needs BASETEN_API_KEY or FIREWORKS_API_KEY)
  --lang <en|id>    Explanation language (default en)
  --json            Output raw JSON instead of ASCII table
  --help, -h        Show this help

Examples:
  node cli.mjs --demo hum --fs 250
  node cli.mjs --demo gaps --rail-min 0 --rail-max 3.3
  node cli.mjs --file samples/hum.csv --explain --lang id
  node cli.mjs --demo flat --json`.trim());
}
function fail(msg) {
  console.error(`Error: ${msg}`);
  console.error(`Run 'node cli.mjs --help' for usage.`);
  process.exit(1);
}
function parseArgs(argv) {
  const out = { demo: null, file: null, fs: 250, railMin: 0, railMax: 3.3, explain: false, lang: 'en', json: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--demo') {
      const v = argv[++i];
      if (!v) fail('--demo requires a value (healthy|hum|clipping|gaps|flat)');
      if (!VALID_KINDS.includes(v)) fail(`Unknown demo kind '${v}'. Use: ${VALID_KINDS.join('|')}`);
      out.demo = v;
    } else if (a === '--file') {
      const v = argv[++i];
      if (!v) fail('--file requires a path');
      out.file = v;
    } else if (a === '--fs') {
      const v = argv[++i];
      if (!v) fail('--fs requires a number');
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) fail(`Invalid --fs '${v}'`);
      out.fs = n;
    } else if (a === '--rail-min') {
      const v = argv[++i];
      if (v === undefined) fail('--rail-min requires a number');
      const n = Number(v);
      if (!Number.isFinite(n)) fail(`Invalid --rail-min '${v}'`);
      out.railMin = n;
    } else if (a === '--rail-max') {
      const v = argv[++i];
      if (v === undefined) fail('--rail-max requires a number');
      const n = Number(v);
      if (!Number.isFinite(n)) fail(`Invalid --rail-max '${v}'`);
      out.railMax = n;
    } else if (a === '--explain') out.explain = true;
    else if (a === '--lang') {
      const v = argv[++i];
      if (!v) fail('--lang requires en or id');
      if (!VALID_LANGS.includes(v)) fail(`Invalid --lang '${v}'. Use en|id`);
      out.lang = v;
    } else if (a === '--json') out.json = true;
    else fail(`Unknown option '${a}'`);
  }
  if (out.help) return out;
  if (!out.demo && !out.file) fail('Provide --demo <kind> or --file <path.csv>');
  if (out.demo && out.file) fail('Use either --demo or --file, not both');
  return out;
}
function fmtValueForEvidence(e) {
  if (e.value === null) return 'Unavailable';
  if (e.unit === 'gaps') return String(e.value);
  if (e.id === 'E5') return String(e.value);
  return Number(e.value).toFixed(3);
}
function repeat(ch, n) { return ch.repeat(n); }
function renderTable(headers, rows, colWidths) {
  const line = '+' + colWidths.map(w => repeat('-', w + 2)).join('+') + '+';
  const pad = (s, w) => ' ' + s + repeat(' ', w - String(s).length) + ' ';
  const lines = [];
  lines.push(line);
  lines.push('|' + headers.map((h, i) => pad(h, colWidths[i])).join('|') + '|');
  lines.push(line);
  for (const r of rows) lines.push('|' + r.map((c, i) => pad(String(c), colWidths[i])).join('|') + '|');
  lines.push(line);
  return lines.join('\n');
}
function sparkline(values) {
  const chars = ['\u2581','\u2582','\u2583','\u2584','\u2585','\u2586','\u2587','\u2588'];
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map(v => {
    const idx = Math.round(((v - min) / range) * (chars.length - 1));
    return chars[Math.max(0, Math.min(chars.length - 1, idx))];
  }).join('');
}
function spectrumAscii(report) {
  const e4 = report.evidence.find(e => e.id === 'E4');
  if (e4.value === null || !report.spectrum.length) {
    return [
      'Spectrum: WITHHELD',
      '  E4 is null \u2014 spectrum withheld for short, irregular, slow, or flat captures.',
      '  Reason: gaps > 0, jitter > 2%, duration < 1s, or sample rate < 120 Hz (see E5/E6).',
      '  No ASCII spectrum rendered. Recapture with regular timestamps before interpreting 50 Hz band.',
      '  Withheld-spectrum warning: E4 is null \u2014 no spectrum available.'
    ].join('\n');
  }
  const filtered = report.spectrum.filter(b => b.hz <= 120);
  const targetCols = 60;
  const bucketSize = Math.max(1, Math.ceil(filtered.length / targetCols));
  const buckets = [];
  for (let i = 0; i < filtered.length; i += bucketSize) {
    const slice = filtered.slice(i, i + bucketSize);
    const maxP = Math.max(...slice.map(b => b.power));
    buckets.push(maxP);
  }
  const spark = sparkline(buckets);
  let peak = filtered[0];
  for (const b of filtered) if (b.power > peak.power) peak = b;
  const resolution = report.spectrum.length > 1 ? (report.spectrum[1].hz - report.spectrum[0].hz) : report.fs / (report.spectrum.length * 2);
  const barLines = [];
  for (let lo = 0; lo < 120; lo += 10) {
    const hi = lo + 10;
    const binSlice = filtered.filter(b => b.hz >= lo && b.hz < hi);
    const power = binSlice.reduce((s, b) => s + b.power, 0);
    barLines.push({ lo, hi, power });
  }
  const maxBarPower = Math.max(...barLines.map(b => b.power), 1e-12);
  const barOut = barLines.map(b => {
    const width = Math.round((b.power / maxBarPower) * 24);
    const bar = width > 0 ? repeat('\u2588', width) : '\u00b7';
    const label = `${String(b.lo).padStart(3)}\u2013${String(b.hi).padStart(3)} Hz`;
    return `  ${label} | ${bar.padEnd(24)} | ${b.power.toExponential(2)}`;
  });
  return [
    `Spectrum (Hann-windowed ${report.spectrum.length * 2 - 2} -point FFT, ${resolution.toFixed(3)} Hz resolution):`,
    `  Sparkline 0\u2013120 Hz:`,
    `  ${spark}`,
    `  ${'0 Hz'.padEnd(8)}${'60 Hz'.padStart(28)}${'120 Hz'.padStart(26)}`,
    `  Peak: ${peak.hz.toFixed(3)} Hz (power ${peak.power.toExponential(3)})`,
    `  Bars (10 Hz bins, 0\u2013120 Hz):`,
    ...barOut,
    `  E4 48\u201352 Hz band share: ${e4.value === null ? 'Unavailable' : e4.value.toFixed(3) + ' %'}`
  ].join('\n');
}
function renderReport(report, sourceLabel) {
  const lines = [];
  lines.push('='.repeat(72));
  lines.push(' SignalProof Bench Inspector \u2014 Evidence Ledger');
  lines.push('='.repeat(72));
  lines.push(` Source   : ${sourceLabel}`);
  lines.push(` Samples  : ${report.samples}  |  fs: ${report.fs.toFixed(3)} Hz  |  Duration: ${report.duration.toFixed(3)} s`);
  lines.push(` Rails    : ${report.railMin} V to ${report.railMax} V`);
  lines.push('');
  lines.push('Evidence Ledger (E1\u2013E6):');
  const headers = ['ID', 'Label', 'Value', 'Unit', 'Method'];
  const colWidths = [4, 22, 12, 6, 55];
  const rows = report.evidence.map(e => {
    const val = fmtValueForEvidence(e);
    let method = e.method;
    if (method.length > 55) method = method.slice(0, 52) + '...';
    return [e.id, e.label, val, e.unit, method];
  });
  lines.push(renderTable(headers, rows, colWidths));
  lines.push('');
  lines.push('Evidence Methods (full):');
  for (const e of report.evidence) {
    const val = fmtValueForEvidence(e);
    lines.push(`  ${e.id} ${e.label}: ${val} ${e.value === null ? '' : e.unit} \u2014 ${e.method}`);
  }
  lines.push('');
  lines.push('Findings (deterministic):');
  if (!report.findings.length) lines.push('  (none)');
  else for (const f of report.findings) {
    lines.push(`  - ${f.id} [${f.severity}] ${f.title}`);
    lines.push(`    evidence: ${f.evidence.join(', ')}`);
    lines.push(`    next: ${f.next}`);
  }
  lines.push('');
  lines.push(spectrumAscii(report));
  lines.push('');
  lines.push('Limits:');
  for (const l of report.limits) lines.push(`  \u2022 ${l}`);
  lines.push('='.repeat(72));
  return lines.join('\n');
}
async function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) { printHelp(); return; }
  let rows;
  let sourceLabel;
  if (opts.demo) {
    const fs = opts.fs;
    const n = Math.max(64, Math.min(32768, Math.round(fs * 4)));
    rows = demo(opts.demo, { fs, n, amplitude: 0.32 });
    sourceLabel = `Synthetic / ${opts.demo} (demo=${opts.demo}, fs=${fs} Hz, ${rows.length} samples)`;
  } else if (opts.file) {
    const p = resolve(opts.file);
    let text;
    try { text = await readFile(p, 'utf8'); } catch (e) {
      console.error(`Error: cannot read file '${opts.file}': ${e.message}`);
      process.exit(1);
    }
    try { rows = parseCSV(text); } catch (e) {
      console.error(`CSV error: ${e.message}`);
      process.exit(1);
    }
    sourceLabel = `File / ${opts.file} (${rows.length} samples)`;
  }
  let report;
  try { report = analyze(rows, { railMin: opts.railMin, railMax: opts.railMax }); } catch (e) {
    console.error(`Analyze error: ${e.message}`);
    process.exit(1);
  }
  let explanation = null;
  if (opts.explain) {
    try { explanation = await explain(report, opts.lang); } catch (e) {
      explanation = { status: 'unavailable', message: String(e.message).slice(0, 200) };
    }
  }
  if (opts.json) {
    const out = { report, source: sourceLabel };
    out.explanation = opts.explain ? explanation : { status: 'not-requested' };
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  console.log(renderReport(report, sourceLabel));
  if (opts.explain) {
    console.log('');
    console.log('Meta Muse Spark Open Explanation:');
    console.log('-'.repeat(72));
    if (!explanation) console.log('  (no explanation)');
    else if (explanation.status === 'live') {
      console.log(`  Status   : live (${explanation.provider} ${explanation.model})`);
      console.log(`  Summary  : ${explanation.summary}`);
      console.log(`  Evidence : ${explanation.evidenceIds.join(', ')}`);
      console.log(`  Findings : ${explanation.findingIds.join(', ')}`);
      console.log(`  Uncertainty: ${explanation.uncertainty}`);
      if (explanation.usage) console.log(`  Usage    : ${JSON.stringify(explanation.usage)}`);
      if (explanation.notice) console.log(`  Notice   : ${explanation.notice}`);
    } else if (explanation.status === 'unconfigured') {
      console.log(`  Status   : unconfigured`);
      console.log(`  Message  : ${explanation.message}`);
    } else if (explanation.status === 'unavailable') {
      console.log(`  Status   : unavailable`);
      console.log(`  Message  : ${explanation.message}`);
    } else {
      console.log(`  Status   : ${explanation.status}`);
      console.log(`  Detail   : ${JSON.stringify(explanation, null, 2)}`);
    }
    console.log('-'.repeat(72));
  }
}
await main();
