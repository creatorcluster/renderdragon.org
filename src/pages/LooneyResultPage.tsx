import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { IconAlertTriangle, IconArrowLeft, IconLoader2 } from '@tabler/icons-react';
import Footer from '@/components/Footer';
import LooneyResultDisplay from '@/components/LooneyResultDisplay';
import { LooneyJob, LooneyHistoryRecord } from '@/types/looney';
import { getLooneyJob, streamLooneyJob } from '@/utils/looneyChecker';
import { loadLooneyHistory, looneyHistoryUpdateEvent, saveLooneyHistoryRecord, updateLooneyHistoryFromJob } from '@/utils/looneyHistory';

const recordFromJob = (jobId: string, job: LooneyJob, current?: LooneyHistoryRecord): LooneyHistoryRecord => {
  const track = job.result?.request?.track;
  const request = job.result?.request;
  const spotifyUrl = request && typeof request.spotify_url === 'string' ? request.spotify_url : undefined;
  const trackTitle = track && typeof track.title === 'string' ? track.title : track && typeof track.name === 'string' ? track.name : undefined;
  return {
    jobId,
    sourceLabel: current?.sourceLabel || trackTitle || spotifyUrl || `Looney check ${jobId}`,
    sourceType: current?.sourceType || (spotifyUrl ? 'spotify' : 'file'),
    createdAt: current?.createdAt || new Date().toISOString(),
    status: job.status,
    result: job.result || current?.result,
    error: job.error || job.detail || job.message || current?.error,
    progress: current?.progress,
    sourceKey: current?.sourceKey,
  };
};

const LooneyResultPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<LooneyHistoryRecord | null>(() => jobId ? loadLooneyHistory().find((item) => item.jobId === jobId) || null : null);
  const recordRef = useRef(record);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    recordRef.current = record;
  }, [record]);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const localRecord = loadLooneyHistory().find((item) => item.jobId === jobId);
    if (localRecord) {
      setRecord(localRecord);
      setLoading(false);
      setNotFound(false);
    }

    const controller = new AbortController();
    let cancelled = false;
    const loadRemoteRecord = async () => {
      if (localRecord) return;
      try {
        const job = await getLooneyJob(jobId, controller.signal);
        if (cancelled) return;
        const recovered = recordFromJob(jobId, job);
        saveLooneyHistoryRecord(recovered);
        setRecord(recovered);
        setNotFound(false);
      } catch {
        if (!cancelled && !controller.signal.aborted) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadRemoteRecord();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [jobId]);

  useEffect(() => {
    const refresh = () => {
      if (!jobId) return;
      const current = loadLooneyHistory().find((item) => item.jobId === jobId);
      if (current) setRecord(current);
    };
    window.addEventListener(looneyHistoryUpdateEvent, refresh);
    return () => window.removeEventListener(looneyHistoryUpdateEvent, refresh);
  }, [jobId]);

  const running = record?.status === 'queued' || record?.status === 'running';

  useEffect(() => {
    if (!jobId || !running) return;
    const controller = new AbortController();
    let cancelled = false;
    const currentRecord = () => loadLooneyHistory().find((item) => item.jobId === jobId) || recordRef.current!;
    const stream = async () => {
      try {
        const job = await streamLooneyJob(jobId, controller.signal, (progress) => {
          const current = currentRecord();
          const updated = { ...current, progress };
          saveLooneyHistoryRecord(updated);
          if (!cancelled) setRecord(updated);
        });
        const updated = updateLooneyHistoryFromJob(currentRecord(), job);
        saveLooneyHistoryRecord(updated);
        if (!cancelled) setRecord(updated);
      } catch (error) {
        if (!cancelled && !controller.signal.aborted) {
          const current = currentRecord();
          const updated = { ...current, status: 'failed' as const, error: error instanceof Error ? error.message : 'Unable to resume this check.' };
          saveLooneyHistoryRecord(updated);
          setRecord(updated);
        }
      }
    };
    void stream();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [jobId, running]);

  return <div className="flex min-h-screen flex-col">
    <Helmet><title>{record?.sourceLabel || 'Check result'} - Looney</title></Helmet>
    <main className="flex-grow cow-grid-bg bg-background px-4 pb-20 pt-28">
      <div className="container mx-auto max-w-6xl">
        <Link to="/gappa" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><IconArrowLeft className="h-4 w-4" /> Back to checks</Link>
        <div className="mx-auto mt-10 max-w-3xl text-center"><h1 className="text-3xl leading-relaxed md:text-5xl">Check result</h1><p className="mt-4 text-base text-muted-foreground">A saved Looney research report, ready to review before publishing.</p></div>
        {loading ? <div className=" mx-auto mt-10 max-w-lg border-2 border-primary/40 bg-primary/5 p-6 text-center"><IconLoader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-4 text-sm text-muted-foreground">Loading this Looney check...</p></div>
          : record?.result ? <div className="mx-auto mt-10 max-w-5xl"><LooneyResultDisplay result={record.result} sourceType={record.sourceType} sourceLabel={record.sourceLabel} onClose={() => navigate('/gappa')} /></div>
            : running ? <div className=" mx-auto mt-10 max-w-lg border-2 border-primary/40 bg-primary/5 p-6 text-center"><IconAlertTriangle className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-4 text-base">Check in progress</h2><p className="mt-3 break-words text-sm text-muted-foreground">{record.progress || 'Looney is researching this source.'}</p></div>
              : notFound ? <div className=" mx-auto mt-10 max-w-lg border-2 border-amber-500/40 bg-amber-500/5 p-6 text-center"><IconAlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><h2 className="mt-4 text-base">Check not found</h2><p className="mt-3 break-words text-sm text-muted-foreground">This Looney job is no longer available.</p><Link to="/gappa" className="mt-5 inline-block font-semibold text-primary">Return to checks</Link></div>
                : <div className=" mx-auto mt-10 max-w-lg border-2 border-amber-500/40 bg-amber-500/5 p-6 text-center"><IconAlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><h2 className="mt-4 text-base">Check failed</h2><p className="mt-3 break-words text-sm text-muted-foreground">{record?.error || 'Looney could not complete this check.'}</p><Link to="/gappa" className="mt-5 inline-block font-semibold text-primary">Return to checks</Link></div>}
      </div>
    </main>
    <Footer />
  </div>;
};

export default LooneyResultPage;
