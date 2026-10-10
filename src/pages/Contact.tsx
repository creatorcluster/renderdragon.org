import { useState } from "react";
import { IconCopy, IconMail, IconCheck } from '@tabler/icons-react';
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { Helmet } from "react-helmet-async";

interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  socials?: {
    github?: string;
    discord?: string;
    website?: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    name: "Coder-soft",
    role: "Founder",
    avatar: "/assets/codersoft.webp",
    socials: {
      github: "https://github.com/coder-soft",
      discord: "https://discordapp.com/users/1094475489734819840",
      website: "https://codersoft.xyz",
    },
  },
  {
    name: "Clover",
    role: "Admin",
    avatar: "/assets/clover.webp",
    socials: {
      github: "https://github.com/CloverTheBunny",
      discord: "https://discordapp.com/users/789997917661560862",
    },
  },
  {
    name: "Yamura",
    role: "Lead Programmer",
    avatar: "/assets/yamura.webp",
    socials: {
      github: "https://github.com/Yxmura",
      discord: "https://discordapp.com/users/877933841170432071",
      website: "https://yamura.dev",
    },
  },
  {
    name: "TomatoKing",
    role: "King of Yapping",
    avatar: "/assets/tomatoking.webp",
    socials: {
      discord: "https://discordapp.com/users/1279190506126966847",
      website: "https://tomatosportfolio.netlify.app",
    },
  },
  {
    name: "Denji",
    role: "Guides writer",
    avatar: "/assets/denji.webp",
    socials: {
      discord: "https://discordapp.com/users/1114195537093201992",
      website: "https://yournotluis.xyz/",
    },
  },
  {
    name: "IDoTheHax",
    role: "Original Gappa co-creator",
    avatar:
      "https://cdn.discordapp.com/avatars/987323487343493191/3187a33efcddab3592c93ceac0a6016b.webp?size=48",
    socials: {
      github: "https://github.com/idothehax",
      website: "https://idothehax.com/",
      discord: "https://discordapp.com/users/987323487343493191",
    },
  },
  {
    name: "VOVOplay",
    role: "Animator",
    avatar: "/assets/VOVOplay.webp",
    socials: {
      website: "https://vovomotion.com/",
      discord: "https://discordapp.com/users/758322333437394944",
    },
  },
  {
    name: "Utkrista",
    role: "Team Member - Resource Manager",
    avatar:
      "https://images-ext-1.discordapp.net/external/9x3KDeC4d_wC4I9pT-XOYA6bY7VpDR8KK0w2sNEujZg/%3Fsize%3D1024/https/cdn.discordapp.com/avatars/893688296130105375/b2419c4ac0b5591c7ec8324467c404e6.png?format=webp&quality=lossless&width=537&height=537",
    socials: {
      website: "https://utkrista.tech/launcher/",
      discord: "https://discordapp.com/users/1298482806430629959",
    },
  },
];

const socialLink = (href: string, label: string, iconSrc: string) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="rounded-lg border border-border bg-accent p-2 transition-colors hover:border-primary/60"
    aria-label={label}
  >
    <img className="h-4 w-4" src={iconSrc} alt="" loading="lazy" />
  </a>
);

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const email = "contact@renderdragon.org";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Email copied to clipboard!");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Contact - Renderdragon</title>
        <meta
          name="description"
          content="Get in touch with the Renderdragon team for support, feedback, or business inquiries. We're here to help Minecraft content creators succeed."
        />
        <meta property="og:title" content="Contact - Renderdragon" />
        <meta
          property="og:description"
          content="Get in touch with the Renderdragon team for support, feedback, or business inquiries. We're here to help Minecraft content creators succeed."
        />
        <meta
          property="og:image"
          content="https://i.ibb.co/60Mr2Psf/Document.png"
        />
        <meta property="og:url" content="https://renderdragon.org/contact" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact - Renderdragon" />
        <meta
          name="twitter:image"
          content="https://i.ibb.co/60Mr2Psf/Document.png"
        />
      </Helmet>

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
                Contact us
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Questions, feedback, or just want to say hello? We'd love to hear from you.
              </p>
            </header>

            <div className="grid gap-6 md:grid-cols-3 mb-16">
              <div className="md:col-span-2 rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-1">Email us</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We're all volunteers, but we usually reply within 48 hours.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <IconMail className="h-4 w-4 text-primary" />
                    {email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <>
                        <IconCheck className="h-3.5 w-3.5" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <IconCopy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 flex flex-col">
                <h2 className="text-lg font-semibold mb-1">Join the community</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect with creators and the team on Discord.
                </p>
                <a
                  href="https://discord.renderdragon.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <span>Join Discord</span>
                  <img className="h-4 w-4" src="/assets/discord_icon.png" alt="" loading="lazy" />
                </a>
              </div>
            </div>

            <section>
              <h2 className="text-2xl font-semibold tracking-tight mb-6">Meet the team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {teamMembers.map((member) => (
                  <div
                    key={member.name}
                    className="flex flex-col items-center rounded-xl border border-border bg-card p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/60"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden border border-border mb-4">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <h3 className="font-medium">{member.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{member.role}</p>

                    {member.socials && (
                      <div className="mt-auto flex gap-2">
                        {member.socials.github && socialLink(member.socials.github, `${member.name}'s GitHub`, "/assets/github_icon.png")}
                        {member.socials.website && socialLink(member.socials.website, `${member.name}'s Website`, "/assets/domain_icon.png")}
                        {member.socials.discord && socialLink(member.socials.discord, `${member.name}'s Discord`, "/assets/discord_icon.png")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default Contact;
