import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';


const Privacy = () => {

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Privacy Policy - Renderdragon</title>
        <meta name="description" content="Learn about how we protect your privacy and handle your data at Renderdragon." />
        <meta property="og:title" content="Privacy Policy - Renderdragon" />
        <meta property="og:description" content="Learn about how we protect your privacy and handle your data at Renderdragon." />
        <meta property="og:image" content="https://renderdragon.org/ogimg/background.png" />
        <meta property="og:url" content="https://renderdragon.org/privacy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Privacy Policy - Renderdragon" />
        <meta name="twitter:image" content="https://renderdragon.org/ogimg/background.png" />
      </Helmet>

      <Navbar />

      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-minecraftia mb-8 text-center">
              Privacy <span className="text-cow-purple">Policy</span>
            </h1>

            <div className="pixel-card space-y-6">
              <div className="space-y-4 text-muted-foreground">
                <h2 className="text-2xl font-vt323 text-foreground">1. Information We Collect</h2>
                <p>
                  Renderdragon is committed to protecting your privacy. We do not collect personal information
                  such as names, emails, or phone numbers. The only data we collect is limited to standard web server logs, which may include:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>IP addresses</li>
                  <li>Browser type and version</li>
                  <li>Device type</li>
                  <li>Pages visited and referring URLs</li>
                  <li>Time and date of access</li>
                </ul>

                <h2 className="text-2xl font-vt323 text-foreground">2. How We Use Information</h2>
                <p>
                  The information we collect is used exclusively to monitor site performance, detect technical issues,
                  and understand general usage trends to improve the website experience.
                  We do not share, sell, rent, or trade your data with third parties, unless legally required.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">3. Cookies</h2>
                <p>
                  Renderdragon uses cookies for essential site functionality and user experience (e.g., remembering light/dark mode).
                  These cookies do not contain personal data and are never used for advertising or tracking you across other websites.
                  You can disable cookies in your browser settings, but some features may not work correctly.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">4. Third-Party Services</h2>
                <p>
                  We may use privacy-respecting analytics tools (like Google Analytics or alternatives such as Plausible)
                  to understand aggregate website traffic and usage. These services may receive basic non-identifiable information
                  (like your IP address or browser type). No personally identifying data is shared with them.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">5. External Links</h2>
                <p>
                  Our website may link to third-party sites or tools (e.g., YouTube, Spotify, Discord).
                  We are not responsible for the content or privacy practices of those external websites.
                  Please read their privacy policies before engaging with their services.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">6. Data Security</h2>
                <p>
                  We take reasonable steps to secure all data collected through encrypted connections (HTTPS)
                  and limited-access server environments. However, no online system is completely immune to risks,
                  so we recommend not sharing sensitive personal information on any part of our platform.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">7. Children's Privacy</h2>
                <p>
                  Renderdragon is not intended for children under the age of 13.
                  We do not knowingly collect or store data from children. If you believe that a child under 13 has provided us with personal data,
                  please contact us immediately and we will take appropriate action.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">8. Your Data Rights</h2>
                <p>
                  You have the right to request access to any data we may hold about you (if any),
                  or to request deletion of that data. Since we don't collect user accounts or personal identifiers,
                  such requests are rarely needed, but we're happy to help. Just contact us via the Contact page or Discord.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">9. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy to reflect changes to our practices or for legal reasons.
                  Any updates will be posted here, and the "Last updated" date will be changed accordingly.
                </p>

                <h2 className="text-2xl font-vt323 text-foreground">10. Contact Information</h2>
                <p>
                  If you have any questions, feedback, or concerns about your privacy on Renderdragon,
                  please reach out to us through the Contact page or join our Discord server.
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

export default Privacy;