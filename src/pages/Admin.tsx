import { useEffect, useState, lazy, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, Navigate } from 'react-router-dom';
import { isAdminEmail } from '@/lib/admin';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { IconChartAreaLine, IconShield } from '@tabler/icons-react';
import AdminPageSkeleton from '@/components/skeletons/AdminPageSkeleton';

const AdminResourcesManager = lazy(() => import('@/components/admin/AdminResourcesManager'));
const AdminBlogsManager = lazy(() => import('@/components/admin/AdminBlogsManager'));
const AdminCreatorPacksManager = lazy(() => import('@/components/admin/AdminCreatorPacksManager'));

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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <IconShield className="h-8 w-8 text-cow-purple" />
                <h1 className="text-4xl md:text-5xl font-minecraftia">
                  Admin <span className="text-cow-purple">Panel</span>
                </h1>
              </div>
              <Link
                to="/admin/analytics"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <IconChartAreaLine className="h-4 w-4" />
                Traffic Analytics
              </Link>
            </div>

            <Suspense fallback={<AdminPageSkeleton />}>
              <div className="space-y-12">
                <AdminCreatorPacksManager />
                <div className="h-px bg-border/50" />
                <AdminBlogsManager />
                <div className="h-px bg-border/50" />
                <AdminResourcesManager />
              </div>
            </Suspense>

          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;