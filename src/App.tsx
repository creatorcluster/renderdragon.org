import { Suspense, lazy, useState, useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { HelmetProvider } from "react-helmet-async";
import ErrorBoundary from "@/components/ErrorBoundary";
import { IconLoader2 } from "@tabler/icons-react";
import DonateButton from "@/components/DonateButton";
import { AdBlockDetector } from "@/components/AdBlockDetector";
import Navbar from "@/components/Navbar";
import Seo from "@/components/Seo";

// Routes that should never be indexed by search engines.
const PRIVATE_ROUTE_PREFIXES = ['/admin', '/account', '/analytics', '/creator-packs/manage'];

// Subset of private routes that also hide the global Donate button.
const DONATE_HIDDEN_ROUTE_PREFIXES = ['/admin', '/account'];

// Global components wrapper to use hooks like useLocation
const GlobalComponents = () => {
  const location = useLocation();
  const isPrivateRoute = PRIVATE_ROUTE_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  const hideDonateButton = DONATE_HIDDEN_ROUTE_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));
  const routeName = location.pathname === '/' ? 'Minecraft Creator Tools & Resources' :
    location.pathname.split('/').filter(Boolean).map((part) => part.split('-').join(' ')).join(' / ');

  return (
    <>
      <Seo
        title={`${routeName.replace(/\b\w/g, (letter) => letter.toUpperCase())} | RenderDragon`}
        description={`Explore ${routeName} on RenderDragon, free tools and resources for Minecraft content creators.`}
        path={location.pathname}
        robots={isPrivateRoute ? 'noindex, nofollow' : undefined}
      />
      {!hideDonateButton && <DonateButton />}
      <AdBlockDetector />
    </>
  );
};

// Lazy Pages
const Index = lazy(() => import("@/pages/Index"));
const ResourcesHub = lazy(() => import("@/pages/ResourcesHub"));
const Contact = lazy(() => import("@/pages/Contact"));
const BackgroundGenerator = lazy(() => import("@/pages/BackgroundGenerator"));
const MusicCopyright = lazy(() => import("@/pages/MusicCopyright"));
const LooneyResultPage = lazy(() => import("@/pages/LooneyResultPage"));
const Guides = lazy(() => import("@/pages/Guides"));
const GuideView = lazy(() => import("@/pages/GuideView"));
const Community = lazy(() => import("@/pages/Community"));
const AiTitleHelper = lazy(() => import("@/pages/AiTitleHelper"));
const Utils = lazy(() => import("@/pages/Utilities"));
const PlayerRenderer = lazy(() => import("@/pages/PlayerRenderer"));
const Renderbot = lazy(() => import("@/pages/Renderbot"));
const Account = lazy(() => import("@/pages/Account"));
const Admin = lazy(() => import("@/pages/Admin"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const BlogEditor = lazy(() => import("@/components/admin/BlogEditor"));
const ProfileEditor = lazy(() => import("@/components/profile/ProfileEditor"));

const FAQ = lazy(() => import("@/pages/FAQ"));
const TOS = lazy(() => import("@/pages/TOS"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Construction = lazy(() => import("@/pages/Construction"));
const TextGenerator = lazy(() => import("@/pages/TextGenerator"));
const Generators = lazy(() => import("@/pages/Generators"));
const YouTubeDownloader = lazy(() => import("@/pages/YouTubeDownloader"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Showcase = lazy(() => import("@/pages/Showcase"));
const Changelogs = lazy(() => import("@/pages/Changelogs"));
const Profile = lazy(() => import("@/pages/Profile"));
const Blogs = lazy(() => import("@/pages/Blogs"));
const BlogView = lazy(() => import("@/pages/BlogView"));
const NativeApplication = lazy(() => import("@/pages/NativeApplication"));
const CreateCreatorPackPage = lazy(() => import("@/pages/CreateCreatorPackPage"));
const ManageCreatorPacksPage = lazy(() => import("@/pages/ManageCreatorPacksPage"));
const EditCreatorPackPage = lazy(() => import("@/pages/EditCreatorPackPage"));
const CreatorPackPage = lazy(() => import("@/pages/CreatorPackPage"));

const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex flex-col items-center justify-center min-h-screen gap-4">
    <IconLoader2 className="w-12 h-12 animate-spin text-cow-purple" />
    <p className="text-white/80">{message}</p>
  </div>
);

// Marks that a signed-in user has already been auto-redirected from the
// homepage to /resources during the current browser session. Kept in
// sessionStorage so the redirect happens once per session.
const HOME_REDIRECT_FLAG = 'rd_home_redirect_done';

const hasRedirectedHome = () => {
  try {
    return sessionStorage.getItem(HOME_REDIRECT_FLAG) === '1';
  } catch {
    return false;
  }
};

const markHomeRedirected = () => {
  try {
    sessionStorage.setItem(HOME_REDIRECT_FLAG, '1');
  } catch {
    // sessionStorage can be unavailable; the redirect still works, it just
    // may repeat within the session.
  }
};

const clearHomeRedirect = () => {
  try {
    sessionStorage.removeItem(HOME_REDIRECT_FLAG);
  } catch {
    // ignore
  }
};

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  const [redirect, setRedirect] = useState(false);
  const [decided, setDecided] = useState(false);
  const handledUser = useRef<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Signed out: reset so the next signed-in homepage visit redirects again.
      handledUser.current = null;
      clearHomeRedirect();
      setRedirect(false);
      setDecided(true);
      return;
    }

    // Only decide once per signed-in user per mount.
    if (handledUser.current === user.id) return;
    handledUser.current = user.id;

    if (hasRedirectedHome()) {
      setRedirect(false);
    } else {
      markHomeRedirected();
      setRedirect(true);
    }
    setDecided(true);
  }, [user, loading]);

  if (loading) return <LoadingFallback />;
  // Wait for the redirect decision before mounting the lazy homepage, so
  // signed-in users never see a flash of it before landing on /resources.
  if (user && !decided) return <LoadingFallback />;
  if (redirect) return <Navigate to="/resources" replace />;
  return <Index />;
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <HelmetProvider>
            <TooltipProvider>
              <BrowserRouter>
                <Navbar />
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/resources" element={<ResourcesHub />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route
                      path="/background-generator"
                      element={<BackgroundGenerator />}
                    />
                    <Route
                      path="/music-copyright"
                      element={<Navigate to="/gappa" replace />}
                    />
                    <Route
                      path="/gappa"
                      element={<MusicCopyright />}
                    />
                    <Route path="/gappa/check/:jobId" element={<LooneyResultPage />} />
                    <Route path="/guides" element={<Guides />} />
                    <Route path="/guides/:slug" element={<GuideView />} />
                    <Route path="/community" element={<Community />} />
                    <Route
                      path="/ai-title-helper"
                      element={<AiTitleHelper />}
                    />
                    <Route path="/utilities" element={<Utils />} />
                    <Route
                      path="/player-renderer"
                      element={<PlayerRenderer />}
                    />
                    <Route path="/renderbot" element={<Renderbot />} />
                    <Route path="/account" element={<Account />} />
                    <Route path="/account/profile" element={
                      <div className="min-h-screen flex flex-col cow-grid-bg bg-background text-foreground">
                        <main className="flex-grow pt-24 pb-16 px-4 container mx-auto">
                          <ProfileEditor />
                        </main>
                      </div>
                    } />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/analytics" element={<Analytics />} />
                    <Route path="/analytics" element={<Navigate to="/admin/analytics" replace />} />
                    <Route path="/admin/blogs/new" element={
                      <div className="min-h-screen pt-24 pb-16 px-4 container mx-auto">
                        <BlogEditor />
                      </div>
                    } />
                    <Route path="/admin/blogs/:id" element={
                      <div className="min-h-screen pt-24 pb-16 px-4 container mx-auto">
                        <BlogEditor />
                      </div>
                    } />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/tos" element={<TOS />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/construction" element={<Construction />} />
                    <Route path="/text-generator" element={<TextGenerator />} />
                    <Route path="/generators" element={<Generators />} />
                    <Route
                      path="/youtube-downloader"
                      element={<YouTubeDownloader />}
                    />
                    <Route path="/showcase" element={<Showcase />} />
                    <Route path="/u/:username" element={<Profile />} />
                    <Route path="/changelogs" element={<Changelogs />} />
                    <Route path="/blogs" element={<Blogs />} />
                    <Route path="/blogs/:slug" element={<BlogView />} />
                    <Route path="/native-application" element={<NativeApplication />} />
                    <Route path="/creator-packs/new" element={<CreateCreatorPackPage />} />
                    <Route path="/creator-packs/manage" element={<ManageCreatorPacksPage />} />
                    <Route path="/creator-packs/:slug/edit" element={<EditCreatorPackPage />} />
                    <Route path="/creator-packs/:slug" element={<CreatorPackPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <GlobalComponents />
                <AnalyticsTracker />
              </BrowserRouter>
              <Toaster />
              <Sonner />
              <SpeedInsights />
            </TooltipProvider>
          </HelmetProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
