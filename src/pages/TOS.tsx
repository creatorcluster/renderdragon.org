import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';


const TOS = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Terms of Service - Renderdragon</title>
        <meta name="description" content="Read our Terms of Service to understand the rules and guidelines for using Renderdragon's tools and resources." />
        <meta property="og:title" content="Terms of Service - Renderdragon" />
        <meta property="og:description" content="Read our Terms of Service to understand the rules and guidelines for using Renderdragon's tools and resources." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/tos.png" />
        <meta property="og:url" content="https://renderdragon.org/tos" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Terms of Service - Renderdragon" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg/tos.png" />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
              Terms of <span className="text-cow-purple">Service</span>
            </h1>

            <div className="pixel-card space-y-6">
              <div className="space-y-4 text-muted-foreground">
                <h2 className="text-2xl font-vt323 text-foreground">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using Renderdragon ("the Website"), you accept and agree to be bound by these
                  Terms of Service. If you do not agree to these terms, please do not use the Website.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">2. Use of Resources</h2>
                <p>
                  All resources provided on Renderdragon are available for free for both personal and commercial use,
                  unless otherwise stated on the specific resource. Some assets may require attribution to the original creator,
                  which will be clearly indicated on the resource page.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">3. Limitation of Liability</h2>
                <p>
                  All resources and tools on Renderdragon are provided "as is" without any warranties, expressed or implied.
                  In no event shall Renderdragon be liable for any damages including, but not limited to,
                  direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use
                  the Website, its resources, or its tools.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">4. Copyright and Intellectual Property</h2>
                <p>
                  The content on Renderdragon, including but not limited to text, graphics, logos, and software, is either
                  the property of Renderdragon or used with permission from the respective creators.
                  All content is protected under applicable intellectual property laws. Users are granted a limited,
                  non-exclusive license to download and use resources for their own projects, subject to any additional
                  terms specified on individual resource pages.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">5. Copyright Issues</h2>
                <p>
                  Renderdragon is a free library of community-submitted and openly available resources for content creators.
                  While we strive to ensure that most assets are copyright-free or licensed for commercial use,
                  we do not and cannot guarantee that every resource is completely copyright-free.
                </p>
                <p>
                  Renderdragon does not claim ownership over all assets hosted or linked on this platform. These resources
                  are owned by their respective creators and contributors. If a user receives a copyright claim on platforms
                  such as YouTube, Twitch, Kick, or others, it is the user's responsibility to contact the original creator
                  of the resource for clarification.
                </p>
                <p>
                  By using assets from Renderdragon, users acknowledge and accept that they do so at their own risk.
                  Renderdragon is not liable for any copyright claims or disputes that may arise from the use of
                  these resources.
                </p>
                <p>
                  If you believe a resource violates copyright or wish to request its removal, please use the Contact page
                  to report it. We take such concerns seriously and will respond promptly.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">6. User Conduct</h2>
                <p>Users of Renderdragon agree not to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Use the Website for any unlawful or malicious purpose</li>
                  <li>Attempt to gain unauthorized access to any part of the Website or its servers</li>
                  <li>Resell, redistribute, or reupload resources from the Website as their own</li>
                  <li>Falsely claim ownership or authorship of any resource found on the Website</li>
                </ul>

                <h2 className="text-2xl font-vt323 text-foreground">7. Changes to Terms</h2>
                <p>
                  Renderdragon reserves the right to modify or update these Terms of Service at any time without prior notice.
                  Changes will be effective immediately upon posting. Continued use of the Website after any changes
                  constitutes your acceptance of the revised terms.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">8. Contact Information</h2>
                <p>
                  If you have any questions about these Terms of Service, copyright concerns, or need assistance,
                  please reach out to us via the Contact page on <a href="https://renderdragon.org" className="underline">renderdragon.org</a>.
                </p>

                <p className="text-sm border-t border-border pt-4 mt-8">
                  Last updated: April 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default TOS;