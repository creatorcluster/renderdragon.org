import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import LooneyCheckForm from '@/components/LooneyCheckForm';
import LooneyHistorySection from '@/components/LooneyHistorySection';
import LooneyRunningCheckDialog from '@/components/LooneyRunningCheckDialog';
import { IconFileMusic } from '@tabler/icons-react';
import Seo from '@/components/Seo';
import { softwareApplicationSchema } from '@/lib/structuredData';
import { LooneyHistoryRecord } from '@/types/looney';

const MusicCopyright = () => {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [existingJob, setExistingJob] = useState<LooneyHistoryRecord | null>(null);
  const [limitMessage, setLimitMessage] = useState(false);
  const navigate = useNavigate();

  const showRecord = (record: LooneyHistoryRecord) => { if (record.result) navigate(`/gappa/check/${encodeURIComponent(record.jobId)}`); };

  return <div className="flex min-h-screen flex-col">
    <Seo
      title="Looney Checks - Music Copyright Checker | Renderdragon"
      description="Research music licensing and copyright signals before you publish. Check a Spotify track, catalog music, or an audio file you upload yourself."
      path="/gappa"
      jsonLd={softwareApplicationSchema({
        name: "Looney Checks",
        description: "Research music licensing and copyright signals before you publish.",
        path: "/gappa",
        image: "/ogimg/copyright.png",
        category: "UtilitiesApplication",
      })}
    />
    <main className="flex-grow cow-grid-bg bg-background px-4 pb-20 pt-28">
      <div className="container mx-auto max-w-6xl">
         <div className="mx-auto max-w-3xl text-center"><h1 className="text-2xl font-bold leading-relaxed sm:text-3xl md:text-5xl"><span className="text-primary">Looney</span> Checks</h1><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">Research music licensing signals before you publish. Check a Spotify track, catalog music, or an audio file you upload yourself.</p></div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <section className=" min-w-0 overflow-hidden border-2 border-foreground/10 bg-card shadow-sm">
             <div className="border-b border-border p-5 sm:p-7"><div className="flex items-center gap-3"><img src="/assets/looney-icon.png" alt="" aria-hidden="true" className="h-10 w-10 shrink-0 object-contain" /><div><h2 className="font-geist text-base font-semibold leading-relaxed">Start a check</h2><p className="mt-1 text-sm text-muted-foreground">Choose the source you want Looney to inspect.</p></div></div></div>
            <div className="p-5 sm:p-7"><LooneyCheckForm onJobChange={setActiveJobId} onResult={(_, __, ___, jobId) => jobId && navigate(`/gappa/check/${encodeURIComponent(jobId)}`)} onExistingJob={setExistingJob} onLimitReached={() => setLimitMessage(true)} onCheckStart={() => setLimitMessage(false)} /></div>
          </section>
            <aside className=" min-w-0 border-2 border-foreground/10 bg-card p-5 shadow-sm sm:p-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Workflow</p><h2 className="mt-3 text-base leading-relaxed">Three clean steps</h2><ol className="mt-7 space-y-6 text-sm text-muted-foreground"><li className="flex gap-4"><span className="text-primary">01</span><span><strong className="text-foreground">Choose a source.</strong><br />Use a Spotify URL, site music file, or your own upload.</span></li><li className="flex gap-4"><span className="text-primary">02</span><span><strong className="text-foreground">Let Looney research.</strong><br />The check gathers identification and licensing signals.</span></li><li className="flex gap-4"><span className="text-primary">03</span><span><strong className="text-foreground">Read before publishing.</strong><br />Caveats stay visible beside the result, not hidden below it.</span></li></ol><div className="mt-8 flex items-center gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><IconFileMusic className="h-4 w-4 shrink-0 text-primary" />Results are guidance, not a replacement for permission from the rights holder.</div></aside>
        </div>
        <LooneyHistorySection activeJobId={activeJobId} onSelectRecord={showRecord} />
         {limitMessage && <div className=" mx-auto mt-4 max-w-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-center text-sm text-amber-700 dark:text-amber-300">Two checks are already running. Wait for one to finish before starting another.</div>}
      </div>
    </main>
    <Footer />
    <LooneyRunningCheckDialog record={existingJob} onClose={() => setExistingJob(null)} />
  </div>;
};

export default MusicCopyright;
