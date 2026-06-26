import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { Helmet } from 'react-helmet-async';

const FAQ = () => {

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>FAQ - Renderdragon</title>
        <meta name="description" content="Find answers to frequently asked questions about Renderdragon's tools, services, and resources for Minecraft content creators." />
        <meta property="og:title" content="FAQ - Renderdragon" />
        <meta property="og:description" content="Find answers to frequently asked questions about Renderdragon's tools, services, and resources for Minecraft content creators." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/faq.png" />
        <meta property="og:url" content="https://renderdragon.org/faq" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FAQ - Renderdragon" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg/faq.png" />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
<h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
               Frequently Asked <span className="text-cow-purple">Questions</span>
            </h1>

            <div className="pixel-card space-y-6">
              <div className="space-y-8 text-muted-foreground">
                <div>
                  <h2 className="text-2xl font-minecraftia text-foreground mb-4">General Questions</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Is everything on Renderdragon really free?</h3>
                      <p>Yes! All resources, tools, and guides on Renderdragon are 100% free to use. We believe in making content creation accessible to everyone.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Do I need to credit Renderdragon when using resources?</h3>
                      <p>While crediting is not required, it's always appreciated! A simple mention helps spread the word and supports our mission to help more creators.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Can I use resources for commercial projects?</h3>
                      <p>Yes, you can use our resources in your commercial projects unless specifically stated otherwise on the resource page.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-vt323 text-foreground mb-4">Technical Questions</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">What file formats do you support?</h3>
                      <p>We provide resources in various formats including PNG, MP3, WAV, PSD, and more. Each resource specifies its available formats.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Are the tools compatible with my device?</h3>
                      <p>Our tools are web-based and work on any modern browser, regardless of your operating system (Windows, Mac, Linux, etc.).</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">What if I encounter technical issues?</h3>
                      <p>If you experience any technical problems, please reach out through our Discord server or contact page. Our team is here to help!</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-vt323 text-foreground mb-4">Resource Usage</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Can I modify the resources?</h3>
                      <p>Yes, you're free to modify our resources to suit your needs. We encourage creativity!</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Are there any usage restrictions?</h3>
                      <p>The only restriction is reselling or redistributing our resources as-is. Please don't claim our resources as your own or share them on other platforms.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">What about copyright claims?</h3>
                      <p>We strive to provide copyright-safe resources, but it's always good practice to check the specific terms for each resource, especially for music and sound effects.</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-vt323 text-foreground mb-4">Contact & Support</h2>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">How can I get help?</h3>
                      <p>Join our Discord server for quick support, or use the Contact page for specific inquiries. We typically respond within 48 hours.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">Can I suggest new features or resources?</h3>
                      <p>Absolutely! We love hearing from our community. Share your suggestions on our Discord server or through the Contact page.</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-2">How can I support Renderdragon?</h3>
                      <p>The best ways to support us are spreading the word, giving credit when using our resources, and considering a donation if you'd like to contribute financially.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default FAQ;