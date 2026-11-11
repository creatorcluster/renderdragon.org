// These paths are the single source shared by the navbar and the router.
export const ROUTES = {
  home: "/",
  blogs: "/blogs",
  contact: "/contact",
  resources: "/resources",
  utilities: "/utilities",
  community: "/community",
  backgroundGenerator: "/background-generator",
  playerRenderer: "/player-renderer",
  textGenerator: "/text-generator",
  youtubeDownloader: "/youtube-downloader",
  generators: "/generators",
} as const;

export interface NavLink {
  name: string;
  path: string;
  icon: string;
  tag?: string; // optional badge/tag (e.g. "NEW")
}

export interface NavDropdown {
  name: string;
  icon: string;
  links: NavLink[];
}

export const MAIN_NAV: (NavLink | NavDropdown)[] = [
  { name: 'Home', path: ROUTES.home, icon: 'home' },
  { name: 'Blogs', path: ROUTES.blogs, icon: 'text' },
  { name: 'Contact', path: ROUTES.contact, icon: 'contact' },
  {
    name: 'Resources',
    icon: 'resources',
    links: [
      { name: 'Resources Hub', path: ROUTES.resources, icon: 'resources-hub' },
      { name: 'Utilities', path: ROUTES.utilities, icon: 'software' },
      { name: 'Community', path: ROUTES.community, icon: 'yt-videos' },
    ]
  },
  {
    name: 'Tools',
    icon: 'tools',
    links: [
      { name: 'Background Generator', path: ROUTES.backgroundGenerator, icon: 'background' },
      { name: 'Player Renderer', path: ROUTES.playerRenderer, icon: 'player' },
      { name: 'Text Generator', path: ROUTES.textGenerator, icon: 'text' },
      { name: 'Youtube Tools', path: ROUTES.youtubeDownloader, icon: 'yt-downloader' },
      { name: 'Content Generators', path: ROUTES.generators, icon: 'text' }
    ]
  }
];
