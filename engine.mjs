// All signal measurements run without a model or network request.
export const LIMIT = 32768;
const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const median = a => {const b = [...a].sort((x,y)=>x-y); const m=b.length>>1; return b.length%2?b[m]:(b[m-1]+b[m])/2;};
const finite = x => typeof x === 'number' && Number.isFinite(x);
export function parseCSV(text) {
  if (typeof text !== 'string' || text.length > 2_000_000) throw Error('CSV must be text under 2 MB.');
  const lines=text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  if(lines.shift()?.trim() !== 'time_s,value') throw Error('Use the exact CSV header: time_s,value');
  if(lines.length<64 || lines.length>LIMIT) throw Error(`Use 64 to ${LIMIT} samples.`);
  return lines.map((line,i)=>{
    const c=line.split(',');
    if(c.length!==2 || c.some(x=>x.trim()==='')) throw Error(`Invalid CSV row ${i+2}.`);
    const r=c.map(Number);
    if(!r.every(finite)) throw Error(`Non-numeric CSV row ${i+2}.`);
    return r;
  });
}
export function toCSV(rows) {return 'time_s,value\n'+rows.map(r=>r.join(',')).join('\n')+'\n';}
export function demo(kind='healthy', {fs=250, n=1000, amplitude=.32}={}) {
  if(!['healthy','hum','clipping','gaps','flat'].includes(kind)) throw Error('Unknown demo.');
  return Array.from({length:n},(_,i)=>{
    const t=i/fs;
    const base=amplitude*Math.sin(2*Math.PI*12*t)+.08*Math.sin(2*Math.PI*23*t);
    let v=1.65+base;
    if(kind==='hum') v+=.55*Math.sin(2*Math.PI*50*t);
    if(kind==='clipping') v=Math.max(0,Math.min(3.3,1.65+2.3*Math.sin(2*Math.PI*12*t)));
    if(kind==='flat') v=1.65;
    return [t,v];
  }).filter((_,i)=>kind!=='gaps'||i<400||i>=430);
}
export function spectrum(values,fs) {
  const n=2**Math.floor(Math.log2(values.length));
  const raw=values.slice(0,n), dc=mean(raw);
  const re=raw.map((v,i)=>(v-dc)*(.5-.5*Math.cos(2*Math.PI*i/(n-1)))), im=new Array(n).fill(0);
  for(let i=1,j=0;i<n;i++) {let bit=n>>1; for(;j&bit;bit>>=1)j^=bit; j^=bit; if(i<j){[re[i],re[j]]=[re[j],re[i]];}}
  for(let len=2;len<=n;len*=2) for(let base=0;base<n;base+=len) for(let j=0;j<len/2;j++) {
    const angle=-2*Math.PI*j/len, k=base+j, l=k+len/2;
    const r=re[l]*Math.cos(angle)-im[l]*Math.sin(angle), q=re[l]*Math.sin(angle)+im[l]*Math.cos(angle);
    re[l]=re[k]-r; im[l]=im[k]-q; re[k]+=r; im[k]+=q;
  }
  return {n, resolutionHz:fs/n, bins:Array.from({length:n/2+1},(_,i)=>({hz:i*fs/n,power:(re[i]**2+im[i]**2)/(n*n)}))};
}
export function analyze(rows, {railMin=0, railMax=3.3}={}) {
  if(!Array.isArray(rows)||rows.length<64||rows.length>LIMIT) throw Error(`Use 64 to ${LIMIT} samples.`);
  if(!finite(railMin)||!finite(railMax)||railMin>=railMax||Math.max(Math.abs(railMin),Math.abs(railMax))>1e6) throw Error('Declare finite ADC rails within +/- 1,000,000 V, with minimum below maximum.');
  if(!rows.every(r=>Array.isArray(r)&&r.length===2&&r.every(finite))) throw Error('Each sample needs finite numeric time and value.');
  const dt=rows.slice(1).map((r,i)=>r[0]-rows[i][0]);
  if(dt.some(d=>d<=0)) throw Error('Timestamps must strictly increase.');
  const step=median(dt), fs=1/step, values=rows.map(r=>r[1]), dc=mean(values), span=railMax-railMin;
  if(!finite(fs)||!finite(span)||span<=0||values.some(v=>v<railMin-span*.01||v>railMax+span*.01)) throw Error('Values exceed declared ADC range. Check units and rails.');
  const gaps=dt.filter(d=>d>1.5*step).length;
  const jitter=Math.sqrt(mean(dt.filter(d=>d<=1.5*step).map(d=>(d-step)**2)))/step;
  const clipped=values.filter(v=>v<=railMin+.005*span||v>=railMax-.005*span).length;
  const rms=Math.sqrt(mean(values.map(v=>(v-dc)**2))), clippingPct=100*clipped/values.length;
  const duration=rows.at(-1)[0]-rows[0][0];
  const fftValid=gaps===0&&jitter<=.02&&duration>=1&&fs>=120;
  const fft=fftValid?spectrum(values,fs):null;
  const total=fft?fft.bins.filter(b=>b.hz>=5&&b.hz<=Math.min(200,fs/2)).reduce((s,b)=>s+b.power,0):0;
  const line=fft?fft.bins.filter(b=>b.hz>=48&&b.hz<=52).reduce((s,b)=>s+b.power,0):0;
  const linePowerPct=fft&&total>1e-18?100*line/total:null;
  const findings=[];
  if(clippingPct>=1) findings.push({id:'clipping',title:'Samples approach the ADC rails',severity:'issue',evidence:['E3'],next:'Reduce input gain on a low-voltage test source, then capture again.'});
  if(gaps||jitter>.02) findings.push({id:'timing',title:'Capture timing needs attention',severity:'issue',evidence:['E5'],next:'Check timestamp generation and the acquisition buffer. Recapture before interpreting the spectrum.'});
  if(linePowerPct!==null&&linePowerPct>=15) findings.push({id:'hum',title:'Strong energy near 50 Hz',severity:'issue',evidence:['E4'],next:'Compare a battery-powered low-voltage test capture with this recording. Check reference and cable routing.'});
  if(rms<span*.0001) findings.push({id:'flat',title:'Almost no AC variation',severity:'issue',evidence:['E2'],next:'Check the test source and acquisition path with a known low-voltage signal.'});
  if(!fftValid) findings.push({id:'spectrum-unavailable',title:'Spectrum withheld',severity:'unknown',evidence:['E5','E6'],next:'Use at least 1 second, regular timestamps, and a sample rate of at least 120 Hz for this 50 Hz check.'});
  if(!findings.length) findings.push({id:'no-flags',title:'No configured signal-quality flags',severity:'pass',evidence:['E2','E3','E4','E5'],next:'Compare against a calibrated reference capture. This result does not validate the sensor.'});
  const evidence=[
    {id:'E1',label:'DC mean',value:dc,unit:'V',method:'Arithmetic mean of the supplied values.'},
    {id:'E2',label:'AC RMS',value:rms,unit:'V',method:'Square root of mean squared deviation from the DC mean.'},
    {id:'E3',label:'Near-rail samples',value:clippingPct,unit:'%',method:'Samples within 0.5% of either declared ADC rail. Flag threshold: 1%.'},
    {id:'E4',label:'48–52 Hz band share',value:linePowerPct,unit:'%',method:fft?`Hann-windowed ${fft.n}-point FFT. Band power / 5 Hz to min(200 Hz, Nyquist) power. Resolution ${fft.resolutionHz.toFixed(3)} Hz. Flag threshold: 15%.`:'Withheld for short, irregular, slow, or flat captures.'},
    {id:'E5',label:'Observed timing gaps',value:gaps,unit:'gaps',method:`Intervals > 1.5 × median interval. Relative RMS jitter excluding gaps: ${(jitter*100).toFixed(3)}%. No packet-loss claim.`},
    {id:'E6',label:'Capture duration',value:duration,unit:'s',method:`${rows.length} supplied samples. Sample rate inferred from median timestamp interval: ${fs.toFixed(3)} Hz.`}
  ];
  return {schemaVersion:1,samples:rows.length,fs,duration,railMin,railMax,findings,evidence,spectrum:fft?.bins??[],limits:['Engineering prototype for low-voltage bench signals. No medical diagnosis or hardware control.','Thresholds are heuristics. Flags do not establish root cause.','Synthetic evaluation does not establish performance on real hardware.']};
}
