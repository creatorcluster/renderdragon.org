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
            const dismissedAt = localStorage.getItem(ADBLOCK_CACHE_KEY);
            if (dismissedAt) {
                const timePassed = Date.now() - parseInt(dismissedAt, 10);
                if (timePassed < CACHE_DURATION) {
                    return;
                }
            }

            for (const url of ['https://www.googletagmanager.com/gtag/js', 'https://www.google-analytics.com/analytics.js']) {
                try {
                    const controller = new AbortController();
                    const id = setTimeout(() => controller.abort(), 2000);
                    await fetch(url, { mode: 'no-cors', signal: controller.signal });
                    clearTimeout(id);
                    return;
                } catch {
                    continue;
                }
            }

            setIsBlocked(true);
            setIsOpen(true);
        };

        const timer = setTimeout(checkAdBlock, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-2xl">AdBlocker Detected</AlertDialogTitle>
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
