import { IconAlertTriangle, IconBrandSpotify, IconCircleCheck, IconExternalLink, IconFileMusic, IconLink, IconShieldCheck } from '@tabler/icons-react';
import { LooneyResult, LooneyValue } from '@/types/looney';

const labelize = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const primitive = (value: LooneyValue): string | null => value === null || typeof value === 'object' ? null : String(value);
const isUrl = (value: string) => /^https?:\/\//i.test(value);
const hostLabel = (value: string) => { try { return new URL(value).hostname.replace(/^www\./, '').split('.')[0]; } catch { return 'Open source'; } };
const sourceLabelKeys = ['name', 'source', 'site', 'website', 'publisher', 'provider', 'title', 'source_name', 'site_name', 'outlet'];
const hasContent = (value: LooneyValue | undefined) => {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.some(hasContent);
  if (typeof value === 'object') return Object.values(value).some(hasContent);
  return true;
};

const SourceLink = ({ value, spotify = false, label }: { value: string; spotify?: boolean; label?: string }) => {
  let iconUrl = '';
  try { iconUrl = `${new URL(value).origin}/favicon.ico`; } catch { /* fallback icon below */ }
  return <a href={value} target="_blank" rel="noreferrer" title={value} className={` inline-flex max-w-full items-center gap-2 border px-3 py-2 text-sm font-semibold text-white ${spotify ? 'border-[#1ed760] bg-[#1ed760] hover:border-[#1fbd57] hover:bg-[#1fbd57]' : 'border-primary/60 bg-primary hover:border-primary-dark hover:bg-primary/90'}`}><span className=" relative flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden bg-white/90 text-primary"><IconExternalLink className="h-3 w-3" />{iconUrl && <img src={iconUrl} alt="" className="absolute inset-0 h-4 w-4 bg-white object-contain" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}</span><span className="min-w-0 truncate">{spotify ? 'Open in Spotify' : label || hostLabel(value)}</span>{spotify ? <IconBrandSpotify className="h-4 w-4 shrink-0" /> : <IconExternalLink className="h-4 w-4 shrink-0" />}</a>;
};

const ResultValue = ({ value, linkLabel }: { value: LooneyValue; linkLabel?: string }) => {
  const text = primitive(value);
  if (text !== null) return isUrl(text) ? <SourceLink value={text} label={linkLabel} spotify={/open\.spotify\.com/i.test(text)} /> : <span className="break-words whitespace-pre-wrap">{text}</span>;
  if (Array.isArray(value)) return <div className="min-w-0 space-y-2">{value.map((item, index) => <div key={index} className=" min-w-0 break-words border border-border/60 bg-muted p-3"><ResultValue value={item} /></div>)}</div>;
  const objectLabel = Object.entries(value || {}).find(([key, item]) => sourceLabelKeys.includes(key.toLowerCase()) && primitive(item) !== null)?.[1];
  const objectLinkLabel = objectLabel === undefined ? undefined : primitive(objectLabel) || undefined;
  return <div className="min-w-0 space-y-2">{Object.entries(value || {}).map(([key, item]) => <div key={key} className="min-w-0 flex flex-col gap-1 sm:flex-row sm:gap-3"><span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labelize(key)}</span><span className="min-w-0 break-words"><ResultValue value={item} linkLabel={objectLinkLabel} /></span></div>)}</div>;
};

const ResultSection = ({ title, value, warning = false }: { title: string; value?: LooneyValue; warning?: boolean }) => {
  if (!hasContent(value)) return null;
  return <section className={` min-w-0 border p-4 ${warning ? 'border-amber-500/40 bg-amber-500/5' : 'border-border bg-background'}`}><h3 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${warning ? 'text-amber-700 dark:text-amber-300' : 'text-primary'}`}>{title}</h3><div className="min-w-0 break-words text-sm leading-6 text-foreground/85"><ResultValue value={value} /></div></section>;
};

const TrackDetails = ({ track }: { track?: { [key: string]: LooneyValue } }) => {
  if (!track) return null;
  const entries = Object.entries(track).filter(([, value]) => primitive(value) !== null);
  if (!entries.length) return null;
  const trackLabel = entries.find(([key]) => sourceLabelKeys.includes(key.toLowerCase()))?.[1];
  const trackLinkLabel = trackLabel === undefined ? undefined : primitive(trackLabel) || undefined;
  return <div className="grid min-w-0 gap-3 sm:grid-cols-2">{entries.map(([key, value]) => { const raw = primitive(value) || ''; const parsedDate = key.toLowerCase().includes('date') ? new Date(raw) : null; const display = key.toLowerCase().includes('duration') && Number.isFinite(Number(raw)) ? `${Math.floor(Number(raw) / 60000)} min ${Math.round((Number(raw) % 60000) / 1000)} sec` : parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : raw; return <div key={key} className=" min-w-0 border border-border/70 bg-muted p-3"><p className="text-xs uppercase tracking-wide text-muted-foreground">{labelize(key)}</p><div className="mt-1 break-words font-medium">{isUrl(raw) ? <SourceLink value={raw} label={trackLinkLabel} spotify={/open\.spotify\.com/i.test(raw)} /> : display}</div></div>; })}</div>;
};

interface LooneyResultDisplayProps { result: LooneyResult; sourceType?: 'file' | 'spotify'; sourceLabel?: string; onClose?: () => void; }

const LooneyResultDisplay = ({ result, sourceType = 'file', sourceLabel, onClose }: LooneyResultDisplayProps) => {
  const status = result.research?.status || 'complete';
  const title = sourceType === 'file' && sourceLabel ? sourceLabel : result.request?.track?.title || result.request?.track?.name || 'Track analysis';
  const spotify = sourceType === 'spotify';
  return <article className=" min-w-0 overflow-hidden border-2 border-primary/40 bg-card shadow-sm">
     <div className="border-b border-border bg-muted p-5 sm:p-7"><div className="flex min-w-0 flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3">{status === 'complete' ? <IconCircleCheck className="h-6 w-6 text-green-500" /> : status === 'partial' ? <IconAlertTriangle className="h-6 w-6 text-yellow-500" /> : <IconShieldCheck className="h-6 w-6 text-primary" />}<span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{labelize(status)} check</span><span className=" border border-border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{spotify ? 'Spotify link' : 'Audio file'}</span></div><h2 className="mt-4 break-words text-xl leading-relaxed sm:text-2xl">{String(title)}</h2>{sourceLabel && sourceLabel !== title && (spotify && isUrl(sourceLabel) ? <div className="mt-3"><SourceLink value={sourceLabel} spotify /></div> : <p className="mt-2 break-all text-xs text-muted-foreground">{sourceLabel}</p>)}</div>{onClose && <button type="button" onClick={onClose} className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">Close result</button>}</div>{result.research?.summary && <p className="mt-4 max-w-3xl break-words text-sm leading-6 text-muted-foreground">{result.research.summary}</p>}</div>
    <div className={`grid min-w-0 gap-0 ${spotify ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.15fr]'}`}><div className="min-w-0 space-y-4 p-5 sm:p-7"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{spotify ? <IconShieldCheck className="h-4 w-4" /> : <IconFileMusic className="h-4 w-4" />}{spotify ? 'Assessment' : 'File check result'}</div><ResultSection title="Usage assessment" value={result.research?.usage_assessment} /><ResultSection title="Rights and licensing findings" value={result.research?.matches} /><ResultSection title="Warnings and caveats" value={result.research?.warnings} warning /></div><div className="min-w-0 space-y-4 border-t border-border bg-muted p-5 sm:border-l-0 sm:p-7 lg:border-l lg:border-t-0"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{spotify ? <IconLink className="h-4 w-4" /> : <IconFileMusic className="h-4 w-4" />}{spotify ? 'Track details' : 'File details'}</div><TrackDetails track={result.request?.track} /><ResultSection title="Sources" value={result.research?.sources} /><ResultSection title="Official licensing contacts" value={result.research?.official_licensing_contacts} /></div></div>
  </article>;
};

export default LooneyResultDisplay;
