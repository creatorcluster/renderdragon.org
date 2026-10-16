import { lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { isAdminEmail } from '@/lib/admin';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { IconShield, IconChartAreaLine, IconFileText, IconPackage } from '@tabler/icons-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminPageSkeleton from '@/components/skeletons/AdminPageSkeleton';

const AdminBlogsManager = lazy(() => import('@/components/admin/AdminBlogsManager'));
const AdminCreatorPacksManager = lazy(() => import('@/components/admin/AdminCreatorPacksManager'));
const AnalyticsDashboard = lazy(() =>
  import('@/pages/Analytics').then((module) => ({ default: module.AnalyticsDashboard })),
);

const Admin = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow pt-24 pb-16 cow-grid-bg">
          <div className="container mx-auto px-4">
            <div className="max-w-7xl mx-auto">
              <AdminPageSkeleton />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isAuthorized = isAdminEmail(user?.email);

  if (!user || !isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Admin Panel - Renderdragon</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>


      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-8">
              <IconShield className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl ">
                Admin <span className="text-primary">Panel</span>
              </h1>
            </div>

            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-8">
                <TabsTrigger value="analytics" className="gap-2">
                  <IconChartAreaLine className="h-4 w-4" />
                  Traffic Analytics
                </TabsTrigger>
                <TabsTrigger value="blogs" className="gap-2">
                  <IconFileText className="h-4 w-4" />
                  Blogs
                </TabsTrigger>
                <TabsTrigger value="creator-packs" className="gap-2">
                  <IconPackage className="h-4 w-4" />
                  Creator Packs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analytics">
                <Suspense fallback={<AdminPageSkeleton />}>
                  <AnalyticsDashboard />
                </Suspense>
              </TabsContent>

              <TabsContent value="blogs">
                <Suspense fallback={<AdminPageSkeleton />}>
                  <AdminBlogsManager />
                </Suspense>
              </TabsContent>

              <TabsContent value="creator-packs">
                <Suspense fallback={<AdminPageSkeleton />}>
                  <AdminCreatorPacksManager />
                </Suspense>
              </TabsContent>
            </Tabs>

          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
