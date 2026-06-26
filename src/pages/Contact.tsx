import { useState, useEffect } from "react";
import { IconCopy, IconMail, IconCheck, IconBrandGithub, IconGlobe, IconExternalLink } from '@tabler/icons-react';
import Navbar from "@/components/Navbar";
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
    avatar: "/assets/codersoft.png",
    socials: {
      github: "https://github.com/coder-soft",
      discord: "https://discordapp.com/users/1094475489734819840",
      website: "https://coder-soft.pages.dev/",
    },
  },
  {
    name: "Clover",
    role: "Admin",
    avatar: "/assets/clover.jpeg",
    socials: {
      github: "https://github.com/CloverTheBunny",
      discord: "https://discordapp.com/users/789997917661560862",
    },
  },
  {
    name: "Yamura",
    role: "Lead Programmer",
    avatar: "/assets/yamura.png",
    socials: {
      github: "https://github.com/Yxmura",
      discord: "https://discordapp.com/users/877933841170432071",
      website: "https://yamura.dev",
    },
  },
  {
    name: "TomatoKing",
    role: "King of Yapping",
    avatar: "/assets/tomatoking.png",
    socials: {
      discord: "https://discordapp.com/users/1279190506126966847",
      website: "https://tomatosportfolio.netlify.app",
    },
  },
  {
    name: "Denji",
    role: "Guides writer",
    avatar: "/assets/denji.png",
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
    avatar: "/assets/VOVOplay.png",
    socials: {
      website: "https://vovomotion.com/",
      discord: "https://discordapp.com/users/758322333437394944",
    },
  },
];

const Contact = () => {
  const [copied, setCopied] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
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
          content="https://renderdragon.org/ogimg/contact.png"
        />
        <meta property="og:url" content="https://renderdragon.org/contact" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact - Renderdragon" />
        <meta
          name="twitter:image"
          content="https://renderdragon.org/ogimg/contact.png"
        />
      </Helmet>
      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
<h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
               <span className="text-cow-purple">Contact</span> Us
            </h1>

            <div className="bg-card pixel-corners border-2 border-primary/50 p-8 mb-12">
              <div className="mb-8">
                <h2 className="text-2xl font-minecraftia mb-4">Get In Touch</h2>
                <p className="text-muted-foreground mb-6">
                  Have questions, feedback, or just want to say hello? We'd love
                  to hear from you!
                </p>

                <div className="flex items-center space-x-4">
                  <IconMail className="h-5 w-5 text-primary" />
                  <span className="font-medium">{email}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1 h-8 text-xs pixel-corners"
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

              <div className="mb-8">
                <h2 className="text-2xl font-vt323 mb-4">Join Our Community</h2>
                <p className="text-muted-foreground mb-4">
                  Connect with other creators and our team on Discord.
                </p>

                <a
                  href="https://discord.renderdragon.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pixel-btn-primary inline-flex items-center space-x-2"
                >
                  <span>join discord</span>
                  <img
                    className="w-4 h-4"
                    src="/assets/discord_icon.png"
                    alt="Discord"
                  />
                </a>
              </div>

              <div>
                <h2 className="text-2xl font-minecraftia mb-4">Support Hours</h2>
                <p className="text-muted-foreground">
                  Well, we do what we can! We're all volunteers, not benefiting
                  from the project, but if you join our Discord, we'll really
                  try to get you an answer within 48 hours.
                </p>
              </div>
            </div>

            <div>
<h2 className="text-2xl font-minecraftia mb-6 text-center">
                 Meet The Team
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className={`bg-card hover:bg-accent/20 border border-border hover:border-cow-purple transition-all duration-300 pixel-corners p-4 flex flex-col items-center text-center
                      ${activeCard === index ? "scale-105 shadow-lg shadow-cow-purple/20" : ""}`}
                    onMouseEnter={() => setActiveCard(index)}
                    onMouseLeave={() => setActiveCard(null)}
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden mb-4 pixel-corners border-2 border-cow-purple">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h3 className="text-lg font-medium">{member.name}</h3>
                    <p className="text-sm text-cow-purple font-semibold mb-2">
                      {member.role}
                    </p>

                    {/* socials */}
                    {member.socials && (
                      <div className="flex space-x-3 mt-auto">
                        {member.socials.github && (
                          <a
                            href={member.socials.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-secondary hover:bg-primary hover:text-primary-foreground p-2 rounded-md transition-colors"
                            aria-label={`${member.name}'s GitHub`}
                          >
                            <img
                              className="w-4 h-4"
                              src="/assets/github_icon.png"
                              alt="GitHub"
                              loading="lazy"
                            />
                          </a>
                        )}
                        {member.socials.website && (
                          <a
                            href={member.socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-secondary hover:bg-primary hover:text-primary-foreground p-2 rounded-md transition-colors"
                            aria-label={`${member.name}'s Website`}
                          >
                            <img
                              className="w-4 h-4"
                              src="/assets/domain_icon.png"
                              alt="Website"
                              loading="lazy"
                            />
                          </a>
                        )}
                        {member.socials.discord && (
                          <a
                            href={member.socials.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-secondary hover:bg-primary hover:text-primary-foreground p-2 rounded-md transition-colors"
                            aria-label={`${member.name}'s Discord`}
                          >
                            <img
                              className="w-4 h-4"
                              src="/assets/discord_icon.png"
                              alt="Discord"
                              loading="lazy"
                            />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default Contact;
