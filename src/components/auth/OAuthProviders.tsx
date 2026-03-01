import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import PixelSvgIcon from '../PixelSvgIcon';
import { useState } from 'react';

export const OAuthProviders = () => {
    const { signInWithGitHub, signInWithDiscord, signInWithGoogle } = useAuth();
    const [loading, setLoading] = useState(false);

    return (
        <div>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <Button
                    variant="outline"
                    className="pixel-btn-secondary w-full"
                    onClick={async () => {
                        setLoading(true);
                        const { error } = await signInWithGoogle();
                        if (error) {
                            toast.error(error);
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                >
                    <img
                        src="/assets/google_icon.png"
                        alt="Google"
                        className="mr-2 h-5 w-5"
                    />
                    Google
                </Button>
                <Button
                    variant="outline"
                    className="pixel-btn-secondary w-full"
                    onClick={async () => {
                        setLoading(true);
                        const { error } = await signInWithGitHub();
                        if (error) {
                            toast.error(error);
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                >
                    <img
                        src="/assets/github_icon.png"
                        alt="GitHub"
                        className="mr-2 h-5 w-5"
                    />
                    GitHub
                </Button>
                <Button
                    variant="outline"
                    className="pixel-btn-secondary w-full"
                    onClick={async () => {
                        setLoading(true);
                        const { error } = await signInWithDiscord();
                        if (error) {
                            toast.error(error);
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                >
                    <PixelSvgIcon
                        name="discord"
                        className="mr-2 h-5 w-5"
                    />
                    Discord
                </Button>
            </div>
        </div>
    );
}; 