import { useEffect, useRef, useState } from 'react';
import { IconActivity, IconAlertTriangle, IconClock, IconHistory, IconTrash, IconCircleCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { LooneyHistoryRecord } from '@/types/looney';
import { streamLooneyJob } from '@/utils/looneyChecker';
import { clearLooneyHistory, loadLooneyHistory, looneyHistoryUpdateEvent, saveLooneyHistoryRecord, updateLooneyHistoryFromJob } from '@/utils/looneyHistory';

interface LooneyHistorySectionProps {
  activeJobId?: string | null;
  onSelectRecord?: (record: LooneyHistoryRecord) => void;
}

const isRunning = (record: LooneyHistoryRecord) => record.status === 'queued' || record.status === 'running';

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown time' : date.toLocaleString();
};

const LooneyHistorySection = ({ activeJobId, onSelectRecord }: LooneyHistorySectionProps) => {
  const [records, setRecords] = useState<LooneyHistoryRecord[]>(() => loadLooneyHistory());
  const recordsRef = useRef(records);

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    const refresh = () => setRecords(loadLooneyHistory());
    window.addEventListener(looneyHistoryUpdateEvent, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(looneyHistoryUpdateEvent, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    const controllers = new Set<AbortController>();
    let cancelled = false;
    const streamRunningJobs = async () => {
      const runningRecords = recordsRef.current.filter((record) => isRunning(record) && record.jobId !== activeJobId);
      await Promise.all(runningRecords.map(async (record) => {
        const controller = new AbortController();
        controllers.add(controller);
        const currentRecord = () => loadLooneyHistory().find((item) => item.jobId === record.jobId) || record;
        try {
          const job = await streamLooneyJob(record.jobId, controller.signal, (message) => {
            saveLooneyHistoryRecord({ ...currentRecord(), progress: message });
          });
          const updated = updateLooneyHistoryFromJob(currentRecord(), job);
          saveLooneyHistoryRecord(updated);
        } catch (error) {
          if (!controller.signal.aborted) {
            saveLooneyHistoryRecord({
              ...currentRecord(),
              status: 'failed',
              error: error instanceof Error ? error.message : 'Unable to resume this check.',
            });
          }
        } finally {
          controllers.delete(controller);
        }
      }));
      if (!cancelled) setRecords(loadLooneyHistory());
    };

    void streamRunningJobs();
    return () => {
      cancelled = true;
      controllers.forEach((controller) => controller.abort());
    };
  }, [activeJobId]);

  const runningRecords = records.filter(isRunning);
  const historyRecords = records.filter((record) => !isRunning(record));

  return (
    <section className=" mx-auto mt-8 w-full max-w-6xl min-w-0 overflow-hidden border-2 border-foreground/10 bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
         <div className="flex items-center gap-3">
          <div className=" flex h-10 w-10 shrink-0 items-center justify-center bg-primary/15 text-primary">
            <IconHistory className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg">Check history</h2>
            <p className="mt-1 text-sm text-muted-foreground">Jobs continue on the server while this tab is closed.</p>
          </div>
        </div>
        {records.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clearLooneyHistory} className="text-muted-foreground hover:text-destructive">
            <IconTrash className="mr-2 h-4 w-4" /> Clear history
          </Button>
        )}
      </div>

      <div className="mt-6 grid min-w-0 gap-5 md:grid-cols-2">
        <div className="min-w-0">
           <h3 className="mb-3 flex items-center gap-2 text-sm"><IconActivity className="inline-flex h-4 w-4 shrink-0 text-primary" /> Running checks</h3>
          {runningRecords.length === 0 ? (
            <p className=" border border-border/70 bg-muted p-4 text-sm text-muted-foreground">No checks are currently running.</p>
          ) : (
            <div className="space-y-2">
              {runningRecords.map((record) => (
                <div key={record.jobId} className=" border border-primary/30 bg-primary/5 p-3">
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 break-words text-sm font-medium">{record.sourceLabel}</span>
                    <span className="shrink-0 text-xs uppercase tracking-wide text-primary">{record.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{record.progress || `Started ${formatDate(record.createdAt)}`}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0">
           <h3 className="mb-3 flex items-center gap-2 text-sm"><IconClock className="inline-flex h-4 w-4 shrink-0 text-primary" /> Previous checks</h3>
          {historyRecords.length === 0 ? (
            <p className=" border border-border/70 bg-muted p-4 text-sm text-muted-foreground">Your completed checks will appear here.</p>
          ) : (
            <div className="space-y-2">
              {historyRecords.map((record) => (
                <button
                  key={record.jobId}
                  type="button"
                  onClick={() => { if (!record.result) return; onSelectRecord?.(record); }}
                  disabled={!record.result}
                  className=" w-full border border-border/70 bg-muted p-3 text-left transition-colors hover:border-primary/50 disabled:cursor-default disabled:hover:border-border/70"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 break-words text-sm font-medium">{record.sourceLabel}</span>
                    {record.status === 'complete' ? <IconCircleCheck className="h-4 w-4 shrink-0 text-green-500" /> : <IconAlertTriangle className="h-4 w-4 shrink-0 text-red-500" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(record.createdAt)} · {record.status}</p>
                  {record.error && <p className="mt-2 break-words text-xs text-red-400">{record.error}</p>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </section>
  );
};

export default LooneyHistorySection;
