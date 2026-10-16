import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IconLoader2, IconBrandTwitter, IconBrandGithub, IconBrandInstagram, IconBrandLinkedin, IconBrandDiscord, IconBrandYoutube, IconWorld } from '@tabler/icons-react';
import { ProfileLink, ProfileThemeConfig, defaultThemeConfig } from '@/types/profile';
import ProfileThemeEngine from '@/components/profile/ProfileThemeEngine';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { getSmartIconUrl } from "@/lib/utils";

// Types
type ProfileData = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
  links: ProfileLink[] | null;
  theme_config: ProfileThemeConfig | null;
  social_links: Record<string, string> | null;
  verified: boolean | null;
};

type SelectedProfile = Omit<ProfileData, 'email' | 'social_links'> & {
  social_links: unknown;
};

const isSocialLinks = (value: unknown): value is Record<string, string> =>
  value === null || (typeof value === 'object' && Object.values(value).every((item) => typeof item === 'string'));

const SocialIcon = ({ type, url }: { type: string, url: string }) => {
  const iconProps = { className: "w-6 h-6 hover:scale-110 transition-transform" };
  switch (type) {
    case 'twitter': return <a href={url} target="_blank" rel="noreferrer"><IconBrandTwitter {...iconProps} /></a>;
    case 'github': return <a href={url} target="_blank" rel="noreferrer"><IconBrandGithub {...iconProps} /></a>;
    case 'instagram': return <a href={url} target="_blank" rel="noreferrer"><IconBrandInstagram {...iconProps} /></a>;
    case 'linkedin': return <a href={url} target="_blank" rel="noreferrer"><IconBrandLinkedin {...iconProps} /></a>;
    case 'discord': return <a href={url} target="_blank" rel="noreferrer"><IconBrandDiscord {...iconProps} /></a>;
    case 'youtube': return <a href={url} target="_blank" rel="noreferrer"><IconBrandYoutube {...iconProps} /></a>;
    default: return <a href={url} target="_blank" rel="noreferrer"><IconWorld {...iconProps} /></a>;
  }
};

const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        if (!username) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, username, bio, links, social_links, verified, theme_config")
          .eq("username", username)
          .maybeSingle();

        if (error) throw error;
        if (active) {
          const row = data as SelectedProfile | null;
          if (row && typeof row.id === 'string' && isSocialLinks(row.social_links)) {
            setProfile({ ...row, email: null, social_links: row.social_links });
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [username]);

  const theme = profile?.theme_config || defaultThemeConfig;
  // Use custom display name if set, otherwise fallback to standard Logic
  const displayName = theme.customDisplayName || profile?.display_name || profile?.email?.split('@')[0] || profile?.username || "User";
  // Use custom avatar if set, otherwise fallback
  const avatarUrl = theme.customAvatarUrl || profile?.avatar_url;

  const links = profile?.links || [];
  const socials = profile?.social_links || {};

  const getFavicon = (url: string) => {
    return getSmartIconUrl(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground">The user @{username} does not exist.</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <ProfileThemeEngine config={theme}>
      <div className="min-h-screen flex flex-col items-center relative">

        {/* Cover Image */}
        {theme.coverImage && (
          <div className="absolute top-0 left-0 right-0 h-48 md:h-64 bg-cover bg-center z-0 animate-in fade-in duration-700" style={{ backgroundImage: `url(${theme.coverImage})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
          </div>
        )}

        <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center gap-8 max-w-2xl relative z-10 w-full" style={{ marginTop: theme.coverImage ? '12rem' : '6rem' }}>
          <Helmet>
            <title>{`${displayName} (@${profile.username}) | Renderdragon`}</title>
          </Helmet>

          {/* Header Section with Dynamic Alignment */}
          <div className={`
             flex flex-col gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-700
             ${theme.avatarPosition === 'left' ? 'items-start text-left' : theme.avatarPosition === 'right' ? 'items-end text-right' : 'items-center text-center'}
          `}>
            <Avatar className="h-32 w-32 border-4 border-[var(--profile-accent)] shadow-xl bg-background">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              ) : null}
              <AvatarFallback className="text-4xl bg-muted text-muted-foreground">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2 w-full">
              <h1 className="text-4xl font-bold tracking-tight">{displayName}</h1>
              {profile.username && !theme.customDisplayName && (
                <p className="text-lg opacity-75">@{profile.username}</p>
              )}
              {theme.profileTag && (
                <div className={`mt-2 ${theme.avatarPosition === 'left' ? 'text-left' : theme.avatarPosition === 'right' ? 'text-right' : 'text-center'}`}>
                  <span className="px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider shadow-sm backdrop-blur-sm border border-white/10"
                    style={{ backgroundColor: theme.accentColor, color: '#fff' }}>
                    {theme.profileTag}
                  </span>
                </div>
              )}
              {profile.bio && (
                <div className={`mt-4 prose prose-invert prose-lg max-w-none ${theme.avatarPosition === 'left' ? 'text-left' : theme.avatarPosition === 'right' ? 'text-right' : 'text-center'}`}>
                  <ReactMarkdown allowedElements={['h1', 'h2', 'h3', 'p', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'code', 'blockquote', 'img']}>
                    {profile.bio}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            {/* Social Links */}
            {Object.keys(socials).length > 0 && (
              <div className={`flex gap-4 mt-2 flex-wrap ${theme.avatarPosition === 'left' ? 'justify-start' : theme.avatarPosition === 'right' ? 'justify-end' : 'justify-center'}`}>
                {Object.entries(socials).map(([key, url]) => (
                  url ? <SocialIcon key={key} type={key} url={url as string} /> : null
                ))}
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className={`
            w-full mt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 flex gap-4
            ${theme.buttonStyle === 'icon' ? 'flex-row flex-wrap justify-center items-center' : 'flex-col space-y-4'}
          `}>
            {links.map((link) => (
              link.active && (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    block transition-all hover:scale-[1.1] active:scale-[0.9]
                    ${theme.buttonStyle === 'icon' ? 'p-2' : 'w-full text-center py-4 px-6 text-lg font-medium shadow-md hover:shadow-lg'}
                  `}
                  style={{
                    backgroundColor: theme.buttonStyle === 'icon' ? 'transparent' : (link.color || 'var(--profile-accent)'),
                    color: '#fff',
                    borderRadius: theme.buttonStyle === 'pill' ? '9999px' :
                      theme.buttonStyle === 'rounded' ? '0.75rem' :
                        theme.buttonStyle === 'icon' ? '9999px' :
                          '0',
                    border: theme.buttonStyle === 'pixel' ? '2px solid white' : 'none',
                    boxShadow: theme.buttonStyle === 'pixel' ? '4px 4px 0 rgba(0,0,0,0.5)' : 
                               theme.buttonStyle === 'icon' ? 'none' : undefined,
                  }}
                  title={link.label}
                >
                  <div className="relative w-full flex items-center justify-center">
                    {link.iconColor ? (
                      <div
                        className={`
                             ${theme.buttonStyle === 'icon' ? 'w-8 h-8 drop-shadow-md' : 'w-6 h-6 absolute left-0 opacity-90'}
                           `}
                        style={{
                          backgroundColor: link.iconColor,
                          maskImage: `url(${link.icon || getFavicon(link.url)})`,
                          WebkitMaskImage: `url(${link.icon || getFavicon(link.url)})`,
                          maskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          maskPosition: 'center',
                        }}
                      />
                    ) : (
                      <img
                        src={link.icon || getFavicon(link.url)}
                        alt=""
                        className={`
                            object-contain transition-opacity
                            ${theme.buttonStyle === 'icon' ? 'w-8 h-8 drop-shadow-md' : 'w-6 h-6 absolute left-0 opacity-90'}
                          `}
                      />
                    )}
                    {theme.buttonStyle !== 'icon' && (
                      <span className="z-10">{link.label}</span>
                    )}
                  </div>
                </a>
              )
            ))}
          </div>

          {/* Floating Branding Button */}
          <a
            href="/"
            target="_blank"
            className="fixed bottom-4 right-4 z-50 bg-white text-black font-geist-mono py-2.5 px-5 shadow-xl hover:scale-105 transition-transform border border-white/20 flex flex-row items-center gap-2.5 rounded-lg no-underline"
          >
            <img src="/renderdragon.png" alt="RD" className="w-5 h-5 object-contain" />
            <span className="text-sm font-bold">Made in RenderDragon.</span>
          </a>
        </main>
      </div>
    </ProfileThemeEngine>
  );
};

export default ProfilePage;
