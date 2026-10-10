
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { IconPlus, IconSearch, IconEdit, IconTrash, IconDownload, IconCalendar } from '@tabler/icons-react';
import { Resource } from '@/types/resources';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdminResourceDialog from './AdminResourceDialog';
import ResourceMigration from './ResourceMigration';
import AdminResourcesManagerSkeleton from '../skeletons/AdminResourcesManagerSkeleton';

const RESOURCES_PER_PAGE = 15;

const AdminResourcesManager = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; resource: Resource | null }>({
    open: false,
    resource: null,
  });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const categories = ['all', 'music', 'sfx', 'images', 'animations', 'fonts', 'presets'];

  const fetchResources = useCallback(async (isNewSearch = false) => {
    try {
      setLoading(true);
      const from = isNewSearch ? 0 : page * RESOURCES_PER_PAGE;
      const to = from + RESOURCES_PER_PAGE - 1;

      let query = supabase
        .from('resources')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,credit.ilike.%${searchTerm}%`);
      }
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory as 'music' | 'sfx' | 'images' | 'animations' | 'fonts' | 'presets');
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setResources(prev => isNewSearch ? data || [] : [...prev, ...(data || [])]);

      if (count !== null) {
        setHasMore(count > (isNewSearch ? 0 : page) * RESOURCES_PER_PAGE + (data?.length || 0));
      } else {
        setHasMore((data?.length || 0) === RESOURCES_PER_PAGE);
      }

      if (isNewSearch) {
        setPage(1);
      }

    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory, page]);

  useEffect(() => {
    fetchResources(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedCategory]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    setPage(prev => prev + 1);
  };

  useEffect(() => {
    if (page > 0) {
      fetchResources();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);


  const handleDelete = async (resource: Resource) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resource.id);

      if (error) throw error;

      toast.success('Resource deleted successfully');
      fetchResources(true);
      setDeleteDialog({ open: false, resource: null });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
  };

  const filteredResources = resources;

  const getResourceStats = () => {
    const stats = categories.slice(1).map(category => ({
      category,
      count: resources.filter(r => r.category === category).length
    }));
    return stats;
  };

  if (loading && page === 0) {
    return <AdminResourcesManagerSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Migration Section */}
      <div className="mb-8">
        <h3 className="text-lg mb-4">Data Migration</h3>
        <ResourceMigration />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl mb-2">Resources Manager</h2>
          <p className="text-muted-foreground">
            Manage all resources in your database. Total: {resources.length} resources
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingResource(undefined);
            setDialogOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <IconPlus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {getResourceStats().map(({ category, count }) => (
          <Card key={category} className="">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{count}</p>
              <p className="text-sm text-muted-foreground capitalize">{category}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 w-full">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize text-xs">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className=" overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1">{resource.title}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {resource.category}
                    </Badge>
                    {resource.subcategory && (
                      <Badge variant="outline" className="text-xs">
                        {resource.subcategory}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingResource(resource);
                      setDialogOpen(true);
                    }}
                  >
                    <IconEdit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteDialog({ open: true, resource })}
                    className="text-red-600 hover:text-red-700"
                  >
                    <IconTrash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {resource.image_url && (
                <div className="mb-3 aspect-video bg-muted rounded overflow-hidden">
                  <img
                    src={resource.image_url}
                    alt={resource.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {resource.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {resource.description}
                </p>
              )}

              <div className="space-y-2 text-xs text-muted-foreground">
                {resource.credit && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Credit:</span>
                    <span>{resource.credit}</span>
                  </div>
                )}
                {resource.filetype && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Type:</span>
                    <span>{resource.filetype}</span>
                  </div>
                )}
                {resource.created_at && (
                  <div className="flex items-center gap-1">
                    <IconCalendar className="h-3 w-3" />
                    <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No resources found matching your criteria.</p>
        </div>
      )}

      <div className="flex justify-center mt-6">
        {hasMore && (
          <Button onClick={loadMore} disabled={loading}>
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>

      {/* Dialogs */}
      <AdminResourceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        resource={editingResource}
        onSave={() => fetchResources(true)}
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, resource: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.resource?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.resource && handleDelete(deleteDialog.resource)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminResourcesManager;