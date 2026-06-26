import { useEffect, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADBLOCK_CACHE_KEY = 'adblock_warning_dismissed';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export function AdBlockDetector() {
    const [isBlocked, setIsBlocked] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const handleContinue = () => {
        localStorage.setItem(ADBLOCK_CACHE_KEY, Date.now().toString());
        setIsOpen(false);
    };

    useEffect(() => {
        const checkAdBlock = async () => {
            // Check cache first
            const dismissedAt = localStorage.getItem(ADBLOCK_CACHE_KEY);
            if (dismissedAt) {
                const timePassed = Date.now() - parseInt(dismissedAt, 10);
                if (timePassed < CACHE_DURATION) {
                    
                    return;
                }
            }

            try {
                const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
                // Try fetching the /decide endpoint which is critical for PostHog and often blocked
                // We use string concatenation to ensure the URL is well-formed
                const url = `${host}/decide?v=3&ip=1&_=`;




                await fetch(url + Date.now(), {
                    method: 'POST', // POST requests to tracking endpoints are more likely to be blocked
                    mode: 'no-cors',
                    body: JSON.stringify({ token: 'test' })
                });

            } catch (error) {
                console.warn("PostHog request failed, likely blocked:", error);
                setIsBlocked(true);
                setIsOpen(true);
            }
        };

        // Small delay to ensure network stack is ready
        const timer = setTimeout(checkAdBlock, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>AdBlocker Detected</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        <p>
                            It looks like you are using an adblocker.
                        </p>
                        <p>
                            RenderDragon <strong>never shows you ads</strong>, but our services (analytics, feature flags) are often blocked by these tools.
                        </p>
                        <p>
                            This might disturb our services and degrade your experience. We kindly ask you to disable your adblocker for our site.
                        </p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleContinue}>Continue with AdBlocker</AlertDialogCancel>
                    <AlertDialogAction onClick={() => window.location.reload()}>I've Disabled It (Refresh)</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
