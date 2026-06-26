import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Changelogs() {
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/changelog.md', { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Failed to load changelog: ${res.status}`);
        const text = await res.text();
        if (active) setMarkdown(text);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load changelog';
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Changelogs - Renderdragon</title>
        <meta name="description" content="See the latest improvements and updates to Renderdragon." />
        <meta property="og:title" content="Changelogs - Renderdragon" />
        <meta property="og:description" content="See the latest improvements and updates to Renderdragon." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/og.png" />
        <meta property="og:url" content="https://renderdragon.org/changelogs" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-6 text-center">
              <span className="text-cow-purple">Project</span> Changelogs
            </h1>
            <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed" style={{ wordSpacing: '0.05em' }}>
              Keep up with new features, improvements, and fixes as we ship them.
            </p>

            {loading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="inline-block w-5 h-5 rounded-full border-2 border-cow-purple border-t-transparent animate-spin" />
                <span>Loading changelog...</span>
              </div>
            ) : error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              <article
                className="prose prose-invert max-w-none font-geist leading-loose [&>p]:mb-4 [&>p]:leading-loose [&>h1]:mt-8 [&>h1]:mb-4 [&>h2]:mt-8 [&>h2]:mb-3 [&>ul]:my-4 [&>ol]:my-4 [&_li]:leading-relaxed"
                style={{ wordSpacing: '0.08em' }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdown || '*No changelog entries yet.*'}
                </ReactMarkdown>
              </article>
            )}
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
}
