import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  IconChevronDown,
  IconMenu2,
  IconX,
  IconSun,
  IconMoon,
  IconSkull,
  IconExternalLink,
} from "@tabler/icons-react";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Keep for now in case it's a dependency of drawer
import { Toggle } from "@/components/ui/toggle";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import Logo from "./Logo";
import PixelSvgIcon from "./PixelSvgIcon";
import AuthDialog from "./auth/AuthDialog"; // Added for auth
import UserMenu from "./auth/UserMenu"; // Added for auth
import { useAuth } from "@/hooks/useAuth"; // Added for auth
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavLink {
  name: string;
  path: string;
  icon: string;
  tag?: string; // optional badge/tag (e.g. "NEW")
}

interface NavDropdown {
  name: string;
  icon: string;
  links: NavLink[];
}

const mainLinks: (NavLink | NavDropdown)[] = [
  { name: "Home", path: "/", icon: "home" },
  { name: "Blogs", path: "/blogs", icon: "text", tag: "NEW" },
  { name: "Contact", path: "/contact", icon: "contact" },
  {
    name: "Resources",
    icon: "resources",
    links: [
      { name: "Resources Hub", path: "/resources", icon: "resources-hub", tag: "UPDATE" },
      { name: "Utilities", path: "/utilities", icon: "software" },
      { name: "Community", path: "/community", icon: "yt-videos" },
    ],
  },
  {
    name: "Tools",
    icon: "tools", // You can use "tools" or any appropriate icon name
    links: [
      { name: "Music Copyright Checker", path: "/gappa", icon: "music" },
      {
        name: "Background Generator",
        path: "/background-generator",
        icon: "background",
      },
      { name: "Player Renderer", path: "/player-renderer", icon: "player" },
      { name: "Text Generator", path: "/text-generator", icon: "text" },
      {
        name: "Youtube Tools",
        path: "/youtube-downloader",
        icon: "yt-downloader",
        tag: "NEW",
      },
      {
        name: "AI Title Helper",
        path: "/ai-title-helper",
        icon: "text",
        tag: "NEW",
      },
      { name: "Content Generators", path: "/generators", icon: "text" },
      {
        name: "s0",
        path: "https://s0.renderdragon.org/docs",
        icon: "external",
        tag: "NEW",
      },
    ],
  },
];

// Small badge for marking new/updated links
function TagBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-cow-purple text-white text-[10px] leading-none uppercase tracking-wide">
      {label}
    </span>
  );
}

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Kept, but managed by Drawer now
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [openMobileCollapsible, setOpenMobileCollapsible] = useState<
    string | null
  >(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (
      (localStorage.getItem("theme") as "light" | "dark") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
    );
  });
  const isMobile = useIsMobile();
  const [authDialogOpen, setAuthDialogOpen] = useState(false); // Added for auth
  const { user, loading, signOut } = useAuth(); // Added for auth
  const { profile } = useProfile();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Manages Drawer open state

  // ... (lines 111-266 omitted for brevity, logic remains same)

  // ...

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const displayName =
    profile?.username ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User";
  const safeAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  const navigate = useNavigate();

  const handleShowFavorites = () => {
    navigate("/resources?tab=favorites");
  };

  const handleMobileCollapsibleToggle = (name: string) => {
    setOpenMobileCollapsible((prev) => (prev === name ? null : name));
  };

  const isLinkActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  const isDropdownActive = (dropdown: NavDropdown) => {
    return dropdown.links.some((link) => isLinkActive(link.path));
  };

  const getBackgroundStyle = () => {
    let baseStyle: React.CSSProperties = {};
    if (scrolled) {
      baseStyle = {
        opacity: Math.min(scrollProgress * 1.5, 0.98),
        backdropFilter: `blur(${scrollProgress * 8}px)`,
      };
    }

    return baseStyle;
  };

  const isHomePage = location.pathname === "/";
  const isTransparent = isHomePage && !scrolled;

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-300 py-4 ${scrolled ? "shadow-lg" : ""
          }`}
        style={{ top: 0 }}
      >
        <div
          className={`absolute inset-0 z-[-1] pointer-events-none transition-all duration-300 ${isTransparent
            ? "bg-transparent"
            : "bg-gradient-to-r from-background/80 via-background/90 to-background/80 dark:from-background/80 dark:via-background/90 dark:to-background/80"
            }`}
          style={getBackgroundStyle()}
        />
        <div className="container mx-auto px-4 flex justify-between items-center relative z-10">
          <Link
            to="/"
            className="flex items-center space-x-2 text-xl md:text-2xl font-bold tracking-wider"
          >
            <Logo size="lg" mobile={isMobile} />
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {mainLinks.map((link, index) =>
              "path" in link ? (
                <Link
                  key={index}
                  to={link.path}
                  className={`flex items-center gap-1 transition-colors font-vt323 text-xl ${isLinkActive(link.path) ? "text-primary" : "text-foreground hover:text-primary"}`}
                >
                  {/* no icons for desktop */}
                  <span>{link.name}</span>
                  {link.tag && <TagBadge label={link.tag} />}
                </Link>
              ) : (
                <div key={index} className="relative">
                  <DropdownMenu
                    open={activeDropdown === link.name}
                    onOpenChange={(open) => {
                      if (!open) setActiveDropdown(null);
                      if (open) setActiveDropdown(link.name);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`flex items-center transition-colors font-vt323 text-xl ${isDropdownActive(link) ? "text-primary" : "text-foreground hover:text-primary"}`}
                        style={{ transform: "none" }}
                        onPointerEnter={() => setActiveDropdown(link.name)}
                        onPointerDown={() => setActiveDropdown(null)}
                      >
                        {/* no icons on desktop */}
                        <span>{link.name}</span>
                        <IconChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-popover border border-border z-50 pixel-corners"
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <DropdownMenuGroup>
                        {link.links.map((subLink, subIndex) => (
                          <DropdownMenuItem
                            key={subIndex}
                            asChild
                            onSelect={() => setActiveDropdown(null)}
                          >
                            {String(subLink.path).startsWith("http") ? (
                              <a
                                href={subLink.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1 px-2 py-2 cursor-pointer font-vt323 text-xl pixel-corners`}
                                onClick={() => setActiveDropdown(null)}
                              >
                                <span>{subLink.name}</span>
                                {(subLink as NavLink).tag && (
                                  <TagBadge label={(subLink as NavLink).tag!} />
                                )}
                                <IconExternalLink className="w-5 h-5 ml-auto pl-2 opacity-80" />
                              </a>
                            ) : (
                              <Link
                                to={subLink.path}
                                className={`flex items-center gap-1 px-2 py-2 cursor-pointer font-vt323 text-xl pixel-corners ${isLinkActive(subLink.path) ? "text-primary bg-accent/50" : ""}`}
                                onClick={() => setActiveDropdown(null)}
                              >
                                {/* sub link name */}
                                <span>{subLink.name}</span>
                                {(subLink as NavLink).tag && (
                                  <TagBadge label={(subLink as NavLink).tag!} />
                                )}
                              </Link>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ),
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {/* Desktop Auth */}
            <div className="hidden md:flex">
              {loading ? (
                <div className="w-8 h-8 animate-pulse bg-muted rounded-full" />
              ) : user ? (
                <UserMenu onShowFavorites={handleShowFavorites} />
              ) : (
                <Button
                  onClick={() => setAuthDialogOpen(true)}
                  className="pixel-btn-primary"
                >
                  Sign In
                </Button>
              )}
            </div>
            {/* Desktop Theme Toggle */}
            <ThemeToggle className="hidden md:block" />

            {/* Mobile Menu Trigger */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <IconMenu2 className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[90vh] rounded-t-xl bg-background border-t border-border">
                <div className="px-4 py-6 max-h-[calc(100%-60px)] overflow-auto">
                  <div className="flex items-center justify-between mb-6">
                    <Link
                      to="/"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      <Logo size="lg" mobile />
                    </Link>
                  </div>

                  <nav className="space-y-4">
                    {mainLinks.map((link, index) =>
                      "path" in link ? (
                        <Link
                          key={index}
                          to={link.path}
                          className={`flex items-center gap-1 text-xl py-3 border-b border-border font-vt323 ${isLinkActive(link.path) ? "text-primary" : ""}`}
                          onClick={() => setIsDrawerOpen(false)} // Close drawer on link click
                        >
                          <span>{link.name}</span>
                          {link.tag && <TagBadge label={link.tag} />}
                        </Link>
                      ) : (
                        <Collapsible
                          key={index}
                          className="w-full border-b border-border"
                          open={openMobileCollapsible === link.name}
                          onOpenChange={() =>
                            handleMobileCollapsibleToggle(link.name)
                          }
                        >
                          <CollapsibleTrigger className="w-full flex items-center justify-between text-xl py-3">
                            <div className="flex items-center space-x-3 font-vt323">
                              <span>{link.name}</span>
                            </div>
                            <IconChevronDown
                              className={`w-4 h-4 transition-transform duration-300 ${openMobileCollapsible === link.name
                                ? "rotate-180"
                                : ""
                                }`}
                            />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="animate-accordion-down">
                            <div className="pl-8 pb-3 space-y-3">
                              {link.links.map((subLink, subIndex) =>
                                String(subLink.path).startsWith("http") ? (
                                  <a
                                    key={subIndex}
                                    href={subLink.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center space-x-3 py-2 font-vt323 text-xl text-muted-foreground hover:text-foreground`}
                                    onClick={() => setIsDrawerOpen(false)}
                                  >
                                    <span>{subLink.name}</span>
                                    {(subLink as NavLink).tag && (
                                      <TagBadge
                                        label={(subLink as NavLink).tag!}
                                      />
                                    )}
                                    <IconExternalLink className="w-5 h-5 ml-auto pl-2 opacity-80" />
                                  </a>
                                ) : (
                                  <Link
                                    key={subIndex}
                                    to={subLink.path}
                                    className={`flex items-center space-x-3 py-2 font-vt323 text-xl ${isLinkActive(subLink.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                    onClick={() => setIsDrawerOpen(false)} // Close drawer on sub-link click
                                  >
                                    <span>{subLink.name}</span>
                                    {(subLink as NavLink).tag && (
                                      <TagBadge
                                        label={(subLink as NavLink).tag!}
                                      />
                                    )}
                                  </Link>
                                ),
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ),
                    )}
                  </nav>
                  {/* Mobile Auth Section */}
                  <div className="pt-4 border-t border-border mt-4">
                    {loading ? (
                      <div className="w-full h-10 animate-pulse bg-muted rounded-md" />
                    ) : user ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {safeAvatarUrl && (
                              <AvatarImage
                                src={safeAvatarUrl}
                                alt="User avatar"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <AvatarFallback className="bg-cow-purple text-white text-xs">
                              {getInitials(displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {displayName || "User"}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            handleShowFavorites();
                            setIsDrawerOpen(false);
                          }}
                          variant="outline"
                          className="w-full pixel-corners font-vt323"
                        >
                          My Favorites
                        </Button>
                        <Button
                          onClick={async () => {
                            await signOut();
                            setIsDrawerOpen(false);
                          }}
                          variant="outline"
                          className="w-full pixel-corners font-vt323"
                        >
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => {
                          setAuthDialogOpen(true);
                          setIsDrawerOpen(false); // Close drawer when opening auth dialog
                        }}
                        className="w-full pixel-btn-primary font-vt323"
                      >
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center border-t border-border bg-background">
                  <Toggle
                    pressed={theme === "dark"}
                    onPressedChange={toggleTheme}
                    className="w-full flex items-center justify-center gap-2 py-2 font-vt323"
                  >
                    {theme === "dark" ? (
                      <>
                        <PixelSvgIcon name="moon" className="h-5 w-5" />
                        <span>Dark Mode</span>
                      </>
                    ) : (
                      <>
                        <PixelSvgIcon name="sun" className="h-5 w-5" />
                        <span>Light Mode</span>
                      </>
                    )}
                  </Toggle>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        {scrolled && (
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-background/20 z-20">
            <div
              className="h-full bg-cow-purple transition-all duration-300 animate-pulse-neon"
              style={{ width: `${scrollProgress * 100}%` }}
            ></div>
          </div>
        )}
      </header>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default React.memo(Navbar);
