import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { IconEye, IconEyeOff, IconMail, IconLock, IconUser } from '@tabler/icons-react';
import { OAuthProviders } from './OAuthProviders';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthDialog = ({ open, onOpenChange }: AuthDialogProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Controls button loading state
  const { signIn, signUp } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent submission if already loading from CAPTCHA verification or previous auth attempt
    if (loading) {
      return;
    }

    // Client-side validations
    if (!email.trim() || !validateEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (!isLogin && !displayName.trim()) {
      toast.error('Display name is required for signup');
      return;
    }

    setLoading(true); // Set loading for the actual auth attempt
    try {
      const { error } = isLogin
        ? await signIn(email, password, null)
        : await signUp(email, password, displayName, '', '', null);

      if (error) {
        if (error.includes('Invalid login credentials')) {
          toast.error('Invalid email or password');
        } else if (error.includes('User already registered')) {
          toast.error('Account already exists. Please sign in instead.');
        } else if (error.includes('Signup is disabled')) {
          toast.error('New registrations are currently disabled');
        } else {
          toast.error(error || 'Authentication failed');
        }
        console.error('Auth error:', error);
        return;
      }

      // Success
      if (isLogin) {
        toast.success('Welcome back!');
        onOpenChange(false);
      } else {
        toast.success('Account created! Please check your email to verify.');
        onOpenChange(false);
      }

      // Reset form & captcha state on success
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (error) {
      console.error('Auth unexpected error:', error);
      toast.error('Something went wrong during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = useCallback(() => {
    setIsLogin((prevMode) => !prevMode);
    setEmail('');
    setPassword('');
    setDisplayName('');
  }, []);

  const isFormValid = useCallback(() => {
    const fieldsValid =
      email.trim() &&
      validateEmail(email) &&
      password.length >= 6 &&
      (isLogin || displayName.trim());

    // The form is valid if all fields are good AND not currently loading
    const formReady = fieldsValid && !loading;

    return formReady;
  }, [email, password, displayName, isLogin, loading]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pixel-corners max-w-md border-2 border-cow-purple">
        <DialogHeader>
          <DialogTitle className="font-vt323 text-center text-2xl">
            {isLogin ? 'Sign In' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium text-sm">
              Email *
            </Label>
            <div className="relative">
              <IconMail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pixel-corners pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-2"
              >
                <Label htmlFor="displayName" className="font-medium text-sm">
                  Display Name *
                </Label>
                <div className="relative">
                  <IconUser className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pixel-corners pl-10"
                    placeholder="How others will see you"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium text-sm">
              Password *
            </Label>
            <div className="relative">
              <IconLock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pixel-corners pl-10 pr-10"
                placeholder="Enter your password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <IconEyeOff className="h-4 w-4" />
                ) : (
                  <IconEye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {!isLogin && (
              <p className="text-xs text-muted-foreground">
                Must be at least 6 characters long
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                type="submit"
                className="pixel-btn-primary w-full"
                disabled={!isFormValid()}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                  />
                ) : (
                  <>
                    <IconUser className="mr-2 h-4 w-4" />
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </Button>
            </motion.div>
          </AnimatePresence>
          <OAuthProviders />
        </motion.form>

        <div className="mt-4 text-center text-sm">
          {isLogin ? (
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="text-sm text-cow-purple hover:text-cow-purple/80"
            >
              Don't have an account? Sign up
            </Button>
          ) : (
            <Button
              type="button"
              variant="link"
              onClick={toggleMode}
              className="text-sm text-cow-purple hover:text-cow-purple/80"
            >
              Already have an account? Sign in
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthDialog;
