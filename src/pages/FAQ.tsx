import Footer from '@/components/Footer';
import Seo from '@/components/Seo';

interface FaqEntry {
  question: string;
  answer: string;
}

const FAQ_GROUPS: { title: string; entries: FaqEntry[] }[] = [
  {
    title: 'General Questions',
    entries: [
      { question: "Is everything on Renderdragon really free?", answer: "Yes! All resources, tools, and guides on Renderdragon are 100% free to use. We believe in making content creation accessible to everyone." },
      { question: "Do I need to credit Renderdragon when using resources?", answer: "While crediting is not required, it's always appreciated! A simple mention helps spread the word and supports our mission to help more creators." },
      { question: "Can I use resources for commercial projects?", answer: "Yes, you can use our resources in your commercial projects unless specifically stated otherwise on the resource page." },
    ],
  },
  {
    title: 'Technical Questions',
    entries: [
      { question: "What file formats do you support?", answer: "We provide resources in various formats including PNG, MP3, WAV, PSD, and more. Each resource specifies its available formats." },
      { question: "Are the tools compatible with my device?", answer: "Our tools are web-based and work on any modern browser, regardless of your operating system (Windows, Mac, Linux, etc.)." },
      { question: "What if I encounter technical issues?", answer: "If you experience any technical problems, please reach out through our Discord server or contact page. Our team is here to help!" },
    ],
  },
  {
    title: 'Resource Usage',
    entries: [
      { question: "Can I modify the resources?", answer: "Yes, you're free to modify our resources to suit your needs. We encourage creativity!" },
      { question: "Are there any usage restrictions?", answer: "The only restriction is reselling or redistributing our resources as-is. Please don't claim our resources as your own or share them on other platforms." },
      { question: "What about copyright claims?", answer: "We strive to provide copyright-safe resources, but it's always good practice to check the specific terms for each resource, especially for music and sound effects." },
    ],
  },
  {
    title: 'Contact & Support',
    entries: [
      { question: "How can I get help?", answer: "Join our Discord server for quick support, or use the Contact page for specific inquiries. We typically respond within 48 hours." },
      { question: "Can I suggest new features or resources?", answer: "Absolutely! We love hearing from our community. Share your suggestions on our Discord server or through the Contact page." },
      { question: "How can I support Renderdragon?", answer: "The best ways to support us are spreading the word, giving credit when using our resources, and considering a donation if you'd like to contribute financially." },
    ],
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_GROUPS.flatMap((group) => group.entries).map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const FAQ = () => {

  return (
    <div className="min-h-screen flex flex-col">
      <Seo
        title="FAQ - Renderdragon"
        description="Find answers to frequently asked questions about Renderdragon's tools, services, and resources for Minecraft content creators."
        path="/faq"
        jsonLd={faqSchema}
      />


      <main className="flex-grow pt-24 pb-16 cow-grid-bg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl mb-8 text-center">
              Frequently Asked <span className="text-primary">Questions</span>
            </h1>

            <div className="rounded-xl border border-border bg-card p-4 space-y-6">
              <div className="space-y-8 text-muted-foreground">
                {FAQ_GROUPS.map((group, groupIndex) => (
                  <div key={group.title}>
                    <h2 className={`text-2xl ${groupIndex === 0 ? '' : ''} text-foreground mb-4`}>
                      {group.title}
                    </h2>

                    <div className="space-y-6">
                      {group.entries.map(({ question, answer }) => (
                        <div key={question}>
                          <h3 className="text-lg font-medium text-foreground mb-2">{question}</h3>
                          <p>{answer}</p>
                        </div>
                      ))}
                    </div>
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

export default FAQ;
