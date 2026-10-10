import Footer from '@/components/Footer';
import Seo from '@/components/Seo';
import { softwareApplicationSchema } from '@/lib/structuredData';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

import { useState } from 'react';
const AiTitleHelper = () => {
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [niche, setNiche] = useState('');
  const [language, setLanguage] = useState('');
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Use Supabase client to invoke the Edge Function directly

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTitles([]);

    if (!description.trim()) {
      setError('Please enter a description.');
      return;
    }

    setLoading(true);
    try {
      const body: {
        description: string;
        keywords?: string[];
        niche?: string;
        language?: string;
      } = {
        description: description.trim(),
      };

      if (keywords.trim()) {
        body.keywords = keywords
          .split(',')
          .map(k => k.trim())
          .filter(Boolean);
      }
      if (niche.trim()) body.niche = niche.trim();
      if (language.trim()) body.language = language.trim();

      const { data, error: fnError } = await supabase.functions.invoke('ai-titles', {
        body,
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch titles');
      }

      // Expecting shape: { titles: string[], meta: { ... } }
      const out: string[] = Array.isArray(data?.titles) ? data.titles : [];
      if (!out.length) {
        throw new Error('No titles returned by the API.');
      }
      setTitles(out);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="AI Title Helper - Renderdragon"
        description="Generate engaging, SEO-friendly YouTube video titles with AI. Free for Minecraft creators, no signup required."
        path="/ai-title-helper"
        jsonLd={softwareApplicationSchema({
          name: "AI Title Helper",
          description: "Generate engaging, SEO-friendly YouTube video titles with AI.",
          path: "/ai-title-helper",
          image: "/ogimg/aititlehelper.png",
          category: "UtilitiesApplication",
        })}
      />
      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl ">AI Title Helper</h1>
            <p className="text-neutral-300 mt-2 ">Generate multiple short, SEO-friendly YouTube titles. Only the titles are shown below.</p>
          </div>

          <form onSubmit={onSubmit} className="bg-background border border-border  p-4 md:p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-neutral-300 mb-2 inline-block ">Description<span className="text-red-500">*</span></Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your video idea and value proposition..."
                  className="h-28 resize-y  bg-neutral-900 border border-neutral-700 focus:border-primary focus:ring-primary/30"
                />
              </div>

              <div>
                <Label className="text-neutral-300 mb-2 inline-block ">Keywords (comma-separated)</Label>
                <Input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. AI, coding, tutorials"
                  className=" bg-neutral-900 border border-neutral-700 focus:border-primary focus:ring-primary/30"
                />
              </div>

              <div>
                <Label className="text-neutral-300 mb-2 inline-block ">Niche</Label>
                <Input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. programming, fitness"
                  className=" bg-neutral-900 border border-neutral-700 focus:border-primary focus:ring-primary/30"
                />
              </div>

              <div>
                <Label className="text-neutral-300 mb-2 inline-block ">Language</Label>
                <Input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. English"
                  className=" bg-neutral-900 border border-neutral-700 focus:border-primary focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 ">
              <Button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {loading ? 'Generating…' : 'Generate Titles'}
              </Button>
              {error && <span className="text-red-400 text-sm">{error}</span>}
            </div>
          </form>

          {titles.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-2xl ">Titles</h2>
                <span className="text-xs text-neutral-400">{titles.length} suggestions</span>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {titles.map((t, i) => (
                  <div key={i} className="flex items-center">
                    <Card className=" border border-neutral-800 bg-card text-card-foreground shadow">
                      <CardContent className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <span className="whitespace-pre-line flex-1">{t}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className=""
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(t);
                                setCopiedIndex(i);
                                setTimeout(() => {
                                  setCopiedIndex(prev => (prev === i ? null : prev));
                                }, 1500);
                              } catch (e) {
                                // swallow clipboard errors silently
                              }
                            }}
                            aria-label={`Copy title ${i + 1}`}
                          >
                            {copiedIndex === i ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    {i < titles.length - 1 && (
                      <span className="mx-1 text-neutral-500">,</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AiTitleHelper;