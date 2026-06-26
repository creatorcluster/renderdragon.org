import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { IconUser, IconMail, IconCalendar, IconLogout } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import AccountPageSkeleton from '@/components/skeletons/AccountPageSkeleton';

const Account = () => {
  const { user, loading, signOut } = useAuth();
  const { updateProfile, profile } = useProfile();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const avatarSrc: string | undefined =
    profile?.avatar_url ??
    ((user?.user_metadata as Record<string, unknown> | undefined)?.avatar_url as string | undefined) ??
    ((user?.user_metadata as Record<string, unknown> | undefined)?.picture as string | undefined);

  // Ensure we only attempt to load valid http/https URLs to avoid 404 noise
  const toSafeHttpUrl = (url?: string | null) => {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:') return u.toString();
      return undefined;
    } catch {
      return undefined;
    }
  };
  const safeAvatarSrc = toSafeHttpUrl(avatarSrc);

  useEffect(() => {
    if (user) {
      // Load profile data from user metadata or profile
      setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16 cow-grid-bg">
          <div className="container mx-auto px-4">
            <AccountPageSkeleton />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const result = await updateProfile({
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
      });

      if (result.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('An error occurred while updating your profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast.success('Signed out successfully');
      } else {
        toast.error('Failed to sign out. Please try again.');
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('An error occurred while signing out.');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>My Account - Renderdragon</title>
        <meta name="description" content="Manage your Renderdragon account settings and profile information." />
      </Helmet>
      
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-8">
              <IconUser className="h-8 w-8 text-cow-purple" />
              <h1 className="text-4xl md:text-5xl font-minecraftia">
                My <span className="text-cow-purple">Account</span>
              </h1>
            </div>

            <Card className="pixel-corners border-2 border-cow-purple/20">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    {safeAvatarSrc ? <AvatarImage src={safeAvatarSrc} referrerPolicy="no-referrer" /> : null}
                    <AvatarFallback className="bg-cow-purple text-white font-bold text-lg">
                      {getInitials(displayName || user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-vt323">{displayName || 'User'}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <IconMail className="h-4 w-4" />
                      {user.email}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-vt323 text-cow-purple">Profile Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="How others will see you"
                        className="pixel-corners"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="Your first name"
                          className="pixel-corners"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Your last name"
                          className="pixel-corners"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-vt323 text-cow-purple">Account Details</h3>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <IconMail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Email:</span>
                        <span>{user.email}</span>
                      </div>
                      
                      {user.created_at && (
                        <div className="flex items-center gap-2">
                          <IconCalendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Member since:</span>
                          <span>{new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isUpdating}
                      className="pixel-btn-primary"
                    >
                      {isUpdating ? 'Updating...' : 'Update Profile'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSignOut}
                      className="pixel-corners border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <IconLogout className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Account;