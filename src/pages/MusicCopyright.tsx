import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { IconMusic, IconSearch, IconAlertCircle, IconRefresh, IconInfoCircle, IconBrandYoutube } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { checkCopyrightStatus, extractYouTubeID } from '@/utils/copyrightChecker';
import { CopyrightResult } from '@/types/copyright';
import ResultsDisplay from '@/components/ResultsDisplay';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import AuthDialog from '@/components/auth/AuthDialog';
import ResultsDisplaySkeleton from '@/components/skeletons/ResultsDisplaySkeleton';

const MusicCopyright = () => {
  const [activeTab, setActiveTab] = useState('song');
  const [songArtist, setSongArtist] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CopyrightResult | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const RATE_LIMIT = 6;
  const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  const LOCALSTORAGE_KEY = 'gappa-checks';

  function getRecentChecks() {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return [];
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      // Only keep timestamps within the last hour
      const now = Date.now();
      return arr.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    } catch {
      return [];
    }
  }

  function logCheck() {
    const now = Date.now();
    const arr = getRecentChecks();
    arr.push(now);
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(arr));
  }

  const handleReset = () => {
    setResult(null);
    setSearchAttempted(false);
    setSongArtist('');
    setSongTitle('');
    setYoutubeUrl('');
  };
  
  const handleSearch = async () => {
    setSearchAttempted(true);
    // Rate limit check
    const recentChecks = getRecentChecks();
    if (recentChecks.length >= RATE_LIMIT) {
      toast.error('Rate limit reached', {
        description: `You can only check 6 songs per hour per device. Please try again later.`,
      });
      return;
    }
    let query;
    if (activeTab === 'song') {
      if (!songArtist.trim() || !songTitle.trim()) {
        toast.error('Please enter both artist and title.');
        return;
      }
      query = { artist: songArtist, title: songTitle };
    } else {
      if (!youtubeUrl.trim() || !extractYouTubeID(youtubeUrl)) {
        toast.error('Please enter a valid YouTube URL.');
        return;
      }
      query = { youtube_url: youtubeUrl };
    }

    setIsLoading(true);
    setResult(null);

    try {
      const copyrightData = await checkCopyrightStatus(query);
      setResult(copyrightData);
      logCheck(); // Log the check only if the request was made

      if (copyrightData.error) {
        toast.error('Error checking copyright', {
          description: copyrightData.error,
        });
      } else {
        toast.success('Analysis complete');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process request', {
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show AuthDialog if not logged in and not loading
  if (!loading && !user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <title>Music Copyright Checker - Renderdragon</title>
          <meta name="description" content="Check if music is safe to use in your Minecraft videos. Avoid copyright strikes with our music copyright checker tool." />
          <meta property="og:title" content="Music Copyright Checker - Renderdragon" />
          <meta property="og:description" content="Check if music is safe to use in your Minecraft videos. Avoid copyright strikes with our music copyright checker tool." />
          <meta property="og:image" content="https://renderdragon.org/ogimg/copyright.png" />
          <meta property="og:url" content="https://renderdragon.org/gappa" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Music Copyright Checker - Renderdragon" />
          <meta name="twitter:image" content="https://renderdragon.org/ogimg/copyright.png" />
        </Helmet>
        <Navbar />
        <main className="flex-grow pt-24 pb-16 cow-grid-bg flex flex-col items-center justify-center">
          <div className="max-w-md w-full mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
              <span className="text-cow-purple">Music Copyright</span> Checker
            </h1>
            <p className="mb-6 text-lg text-muted-foreground">You must be logged in to use the Music Copyright Checker.</p>
            <Button className="pixel-btn-primary mb-4" onClick={() => setAuthDialogOpen(true)}>
              Sign In / Create Account
            </Button>
            <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Music Copyright Checker - Renderdragon</title>
        <meta name="description" content="Check if music is safe to use in your Minecraft videos. Avoid copyright strikes with our music copyright checker tool." />
        <meta property="og:title" content="Music Copyright Checker - Renderdragon" />
        <meta property="og:description" content="Check if music is safe to use in your Minecraft videos. Avoid copyright strikes with our music copyright checker tool." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/copyright.png" />
        <meta property="og:url" content="https://renderdragon.org/gappa" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Music Copyright Checker - Renderdragon" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg/copyright.png" />
      </Helmet>
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-vt323 mb-8 text-center">
              <span className="text-cow-purple">Music Copyright</span> Checker
            </h1>
            
            <p className="text-center text-muted-foreground mb-8 max-w-xl mx-auto">
              Check if a song is safe to use in your videos without copyright issues.
              Avoid strikes and claim problems before uploading your content.
            </p>
            
            <Alert className="mb-8 pixel-corners">
              <IconInfoCircle className="h-4 w-4" />
              <AlertTitle>Disclaimer</AlertTitle>
              <AlertDescription>
                This tool provides general information and is not a guarantee against copyright claims.
                Copyright policies may change over time, and different regions may have different rules.
              </AlertDescription>
            </Alert>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 pixel-corners">
                <TabsTrigger value="song">Song</TabsTrigger>
                <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
              </TabsList>
              <TabsContent value="song">
                <div className="pixel-card space-y-4">
                  <Input
                    placeholder="Artist"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    className="pixel-corners"
                  />
                  <Input
                    placeholder="Song Title"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="pixel-corners"
                  />
                </div>
              </TabsContent>
              <TabsContent value="youtube">
                <div className="pixel-card">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="pixel-corners"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-4">
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="pixel-btn-primary w-full flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <IconRefresh className="h-4 w-4 mr-2 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <IconSearch className="h-4 w-4 mr-2" />
                    <span>Check Copyright</span>
                  </>
                )}
              </Button>
            </div>
            
            {isLoading && <ResultsDisplaySkeleton />}
            
            {!isLoading && result && (
              <ResultsDisplay result={result} onReset={handleReset} />
            )}
            
            {!isLoading && !result && searchAttempted && (
              <div className="text-center py-8">
                <IconAlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No results found</p>
                <p className="text-sm text-muted-foreground mt-2">Try a different search term or check the spelling</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default MusicCopyright;