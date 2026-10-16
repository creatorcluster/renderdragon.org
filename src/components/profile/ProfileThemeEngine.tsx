import React, { useEffect } from 'react';
import { ProfileThemeConfig } from '@/types/profile';

interface ProfileThemeEngineProps {
    config?: ProfileThemeConfig | null;
    children: React.ReactNode;
}

const ProfileThemeEngine: React.FC<ProfileThemeEngineProps> = ({ config, children }) => {
    useEffect(() => {
        if (!config) return;

        const root = document.documentElement;
        // Apply Colors
        root.style.setProperty('--profile-bg', config.backgroundType === 'color' ? config.backgroundColor : 'transparent');
        root.style.setProperty('--profile-text', config.textColor);
        root.style.setProperty('--profile-accent', config.accentColor);

        // Apply Fonts
        let fontStack = 'sans-serif';
        const { fontFamily, fontUrl } = config;

        if (fontUrl) {
            // Load external font
            fontStack = `"${fontFamily}", sans-serif`;
            const loadFont = async () => {
                try {
                    // Simple check to see if we need to add it
                    if (!document.fonts.check(`12px "${fontFamily}"`)) {
                        const fontFace = new FontFace(fontFamily, `url(${fontUrl})`);
                        await fontFace.load();
                        document.fonts.add(fontFace);
                    }
                } catch (e) {
                    console.error("Failed to load font", e);
                }
            };
            loadFont();
        } else {
            switch (fontFamily) {
                case 'geist': fontStack = '"Geist Sans", sans-serif'; break;
                case 'mono': fontStack = '"Geist Mono", monospace'; break;
                case 'inter': fontStack = '"Inter", sans-serif'; break;
                case 'serif': fontStack = 'serif'; break;
                case 'normal':
                case 'pixel': fontStack = '\'Inter\', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; break;
                default: fontStack = 'sans-serif';
            }
        }

        root.style.setProperty('--profile-font', fontStack);

        // Clean up on unmount or change
        return () => {
            root.style.removeProperty('--profile-bg');
            root.style.removeProperty('--profile-text');
            root.style.removeProperty('--profile-accent');
            root.style.removeProperty('--profile-font');
        };
    }, [config]);

    if (!config) return <>{children}</>;

    const getBackgroundStyle = () => {
        if (config.backgroundType === 'image' && config.backgroundImage) {
            return { backgroundImage: `url(${config.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' };
        }
        if (config.backgroundType === 'gradient' && config.backgroundGradient) {
            return { background: config.backgroundGradient };
        }
        return { backgroundColor: config.backgroundColor };
    };

    return (
        <div
            className="min-h-screen transition-colors duration-300 profile-theme-root"
            style={{
                ...getBackgroundStyle(),
                color: config.textColor,
                fontFamily: 'var(--profile-font)',
            }}
        >
            {/* Background Overlay for better text readability if image */}
            {config.backgroundType === 'image' && (
                <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />
            )}

            {/* Force prose and other elements to inherit the theme font, and ensure headers are large/bold */}
            <style>{`
                .profile-theme-root * {
                    font-family: inherit;
                }
                .prose :where(h1, h2, h3, h4, h5, h6, p, a, strong, span, li) {
                    font-family: inherit !important;
                }
                /* Ensure headers are visually distinct regardless of prose defaults or font metrics */
                .prose :where(h1) { font-size: 2.5em; font-weight: 800; line-height: 1.2; margin-top: 1.5em; margin-bottom: 0.8em; }
                .prose :where(h2) { font-size: 2em; font-weight: 700; line-height: 1.3; margin-top: 1.4em; margin-bottom: 0.6em; }
                .prose :where(h3) { font-size: 1.75em; font-weight: 600; line-height: 1.4; margin-top: 1.2em; margin-bottom: 0.5em; }
                .prose :where(h4) { font-size: 1.5em; font-weight: 600; margin-top: 1.0em; margin-bottom: 0.5em; }
                .prose :where(p) { font-size: 1.125em; line-height: 1.75; margin-bottom: 1.25em; }
                .prose :where(strong) { font-weight: 700; color: inherit; }
                /* Fix color contrast for headings if needed */
                .prose :where(h1, h2, h3, h4) { color: inherit; opacity: 0.95; }
            `}</style>


            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
export default ProfileThemeEngine;
