import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useAuth } from '@/hooks/useAuth';
import { IconLogout, IconHeart, IconUser, IconSettings } from '@tabler/icons-react';
import { useProfile } from '@/hooks/useProfile';

interface UserMenuProps {
  onShowFavorites: () => void;
}

const UserMenu = ({ onShowFavorites }: UserMenuProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  if (!user) return null;

  const getInitials = (display: string) => {
    if (!display) return 'U';
    return display.split(' ').join('').slice(0, 2).toUpperCase();
  };

  // Narrow user metadata shape to avoid any
  const meta = (user.user_metadata ?? {}) as {
    avatar_url?: string;
    picture?: string;
    display_name?: string;
  };
  const identities = (user.identities ?? []) as Array<{
    identity_data?: Record<string, unknown> | null;
    provider?: string | null;
  }>;

  // Extract possible URLs from identities (GitHub/Discord sometimes store here)
  const identityAvatar = identities
    .map((i) => (i.identity_data || {}))
    .map((d) => (d?.avatar_url as string) || (d?.picture as string) || (d?.avatar as string) || '')
    .find((u) => !!u);

  const displayName = (profile?.display_name as string | undefined) || meta.display_name || user.email || '';

  // Validate URL is http/https or data: to avoid trying to load invalid strings like CIDs or tokens
  const toSafeHttpUrl = (url?: string | null) => {
    if (!url) return undefined;
    try {
      const u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'data:') return u.toString();
      return undefined;
    } catch {
      return undefined;
    }
  };

  // Choose the first safe candidate among profile, metadata, identities
  const candidates = [profile?.avatar_url, meta.avatar_url, meta.picture, identityAvatar].filter(Boolean) as string[];
  const safeAvatarUrl = candidates.map(toSafeHttpUrl).find((u) => !!u);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Avatar className="h-8 w-8">
              {safeAvatarUrl && <AvatarImage src={safeAvatarUrl} alt="User avatar" referrerPolicy="no-referrer" />}
              <AvatarFallback className="bg-cow-purple text-white text-xs">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 pixel-corners" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/account/profile">
            <IconUser className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/account">
            <IconSettings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShowFavorites} className="cursor-pointer">
          <IconHeart className="mr-2 h-4 w-4" />
          <span>My Favorites</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
          <IconLogout className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default React.memo(UserMenu);