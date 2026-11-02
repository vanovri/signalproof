// Deltas describe measurements, never a repaired sensor or a proven cause.
export function compareReports(reference,current) {
  if(reference.railMin!==current.railMin||reference.railMax!==current.railMax) throw Error('Use the same declared ADC rails for both captures.');
  if(Math.abs(reference.fs-current.fs)>1e-6*Math.max(reference.fs,current.fs)) throw Error('Use matching sample rates for this comparison.');
  if(reference.samples!==current.samples) throw Error('Use the same sample count for both captures.');
  return {
    evidence:current.evidence.map(e=>{
      const before=reference.evidence.find(r=>r.id===e.id);
      return {id:e.id,label:e.label,unit:e.unit,before:before.value,after:e.value,delta:before.value===null||e.value===null?null:e.value-before.value};
    }),
    cleared:reference.findings.filter(f=>f.id!=='no-flags'&&!current.findings.some(c=>c.id===f.id)).map(f=>f.id),
    added:current.findings.filter(f=>f.id!=='no-flags'&&!reference.findings.some(c=>c.id===f.id)).map(f=>f.id),
    notice:'Changes describe these captures only. They do not prove a repair, a cause, or sensor accuracy.'
  };
}
