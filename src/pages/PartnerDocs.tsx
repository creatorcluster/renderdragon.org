import { Helmet } from "react-helmet-async";
import {
  IconArrowUpRight,
  IconKey,
  IconShieldLock,
  IconVersions,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TwitterVerifiedIcon } from "@/components/partners/TwitterVerifiedIcon";
import { CodeBlock } from "@/components/partners/CodeBlock";
import Footer from "@/components/Footer";

const API_BASE = "https://api.codersoft.xyz";
const ISSUER = "https://bmywdrwjdqmrkafhiuwn.supabase.co/auth/v1";

const CANON = `v1
<METHOD>
<PATH?QUERY>
<CLIENT_ID>
<TIMESTAMP>
<NONCE>
<SHA256_HEX(BODY)>`;

const ENDPOINTS = [
  { path: "/all", returns: "Every category and asset in one response." },
  { path: "/categories", returns: "The list of categories." },
  { path: "/category/:name", returns: "One category." },
  { path: "/mcicons", returns: "Minecraft icons." },
  { path: "/fonts", returns: "Fonts." },
  { path: "/__version", returns: "A hash of the catalog, for caching." },
];

const MOCK = `# 1. sign a request (Node)
import crypto from "node:crypto";

const CLIENT_ID = process.env.RD_CLIENT_ID;
const SECRET = process.env.RD_CLIENT_SECRET;
const METHOD = "GET";
const PATH = "/all";

const bodyHash = crypto.createHash("sha256").update("").digest("hex");
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(16).toString("hex");
const canonical = ["v1", METHOD, PATH, CLIENT_ID, timestamp, nonce, bodyHash].join("\\n");
const signature = crypto.createHmac("sha256", SECRET).update(canonical).digest("hex");

const res = await fetch("${API_BASE}" + PATH, {
  headers: {
    "x-auth-client": CLIENT_ID,
    "x-auth-timestamp": timestamp,
    "x-auth-nonce": nonce,
    "x-auth-signature": signature,
    "user-agent": "your-app/1.0",
  },
});
const catalog = await res.json();`;

const OAUTH_RAW = `# 1. send the user to authorize (browser redirect, PKCE)
${ISSUER}/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=https://yourapp.com/auth/callback
  &response_type=code
  &scope=email profile
  &code_challenge=CODE_CHALLENGE
  &code_challenge_method=S256
  &state=RANDOM_STATE

# 2. Supabase sends the user back with ?code=...
#    Exchange it for tokens (confidential client, Basic auth):
curl -X POST ${ISSUER}/oauth/token \\
  -H "Authorization: Basic $(printf 'CLIENT_ID:CLIENT_SECRET' | base64)" \\
  -d grant_type=authorization_code \\
  -d code=THE_CODE \\
  -d code_verifier=CODE_VERIFIER \\
  -d redirect_uri=https://yourapp.com/auth/callback`;

const OAUTH_SUPABASE = `# In your Supabase project, add RenderDragon as a custom OAuth provider
# (Authentication -> Providers -> new custom provider), using the issuer:
#   ${ISSUER}
# Then sign the user in with the provider key you gave it:

const { error } = await supabase.auth.signInWithOAuth({
  provider: "renderdragon",
  options: { redirectTo: "https://yourapp.com/auth/callback" },
});`;

export default function PartnerDocs() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Helmet>
        <title>Partner integration guide | RenderDragon</title>
        <meta
          name="description"
          content="How partners use the RenderDragon asset API and add RenderDragon sign-in to their app."
        />
      </Helmet>

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto max-w-4xl px-4">
          <header>
            <Badge variant="secondary" className="gap-1">
              <TwitterVerifiedIcon className="size-3.5 text-[#1D9BF0]" /> Partner program
            </Badge>
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Build with RenderDragon
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
              A partner integration has two parts: the asset API and RenderDragon sign-in. This page
              covers both. Both are invite-only, and you keep the keys.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <a href="/llms.txt" target="_blank" rel="noreferrer">
                  llms.txt
                  <IconArrowUpRight className="size-4" data-icon="inline-end" aria-hidden />
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="https://renderdragon.org/contact">Request access</a>
              </Button>
            </div>
          </header>

          <Separator className="my-10" />

          <Tabs defaultValue="api">
            <TabsList>
              <TabsTrigger value="api">Asset API</TabsTrigger>
              <TabsTrigger value="signin">Sign in</TabsTrigger>
            </TabsList>

            {/* ------------------------------ Asset API ------------------------------ */}
            <TabsContent value="api" className="mt-8 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-heading text-lg">
                    <IconKey className="size-4 text-primary" aria-hidden />
                    One key, signed requests
                  </CardTitle>
                  <CardDescription>
                    You get a client id and a secret. Every request carries an HMAC-SHA256 signature, so
                    nobody can replay or forge it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Sign this exact string, newlines included, and send it in three headers plus a nonce:
                  </p>
                  <CodeBlock code={CANON} />
                  <p className="text-sm text-muted-foreground">
                    Headers: <code className="font-mono">x-auth-client</code>,{" "}
                    <code className="font-mono">x-auth-timestamp</code>,{" "}
                    <code className="font-mono">x-auth-nonce</code>,{" "}
                    <code className="font-mono">x-auth-signature</code>. The timestamp must be within
                    300 seconds. Send a User-Agent; requests without one are blocked by the edge.
                  </p>
                  <CodeBlock code={MOCK} language="javascript" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Endpoints</CardTitle>
                  <CardDescription>Read-only. Base URL: {API_BASE}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead>Returns</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ENDPOINTS.map((endpoint) => (
                        <TableRow key={endpoint.path}>
                          <TableCell className="font-mono text-sm">{endpoint.path}</TableCell>
                          <TableCell className="text-muted-foreground">{endpoint.returns}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <div className="grid gap-6 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-heading text-base">
                      <IconVersions className="size-4 text-primary" aria-hidden />
                      Cache with /__version
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <code className="font-mono">/__version</code> is public and returns a hash of the
                    catalog. Store it next to your copy and only refetch when it changes. Cached clients
                    skip the rate limit almost entirely.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-heading text-base">
                      <IconShieldLock className="size-4 text-primary" aria-hidden />
                      Limits and credit
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Each key has a per-minute rate limit. Show the author of an asset using its{" "}
                    <code className="font-mono">credit</code> field when it is set, and link back to
                    RenderDragon.
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertTitle>Keys stay on your server</AlertTitle>
                <AlertDescription>
                  The secret is shown once, when you create the key. Keep it server-side and never ship
                  it in a browser bundle. Revoke and rotate keys from the partner dashboard.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* ------------------------------ Sign in ------------------------------ */}
            <TabsContent value="signin" className="mt-8 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Sign in with RenderDragon</CardTitle>
                  <CardDescription>
                    RenderDragon runs an OAuth 2.1 server. You register one app. Users see exactly what
                    it can read, and approve before anything is shared.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                    <li>Send the user to the authorize URL with PKCE.</li>
                    <li>They approve on RenderDragon, which sends a code back to your redirect URI.</li>
                    <li>Exchange the code for an access token and a refresh token.</li>
                    <li>Use the token to read that user's consented data, and refresh it when it expires.</li>
                  </ol>
                </CardContent>
              </Card>

              <Tabs defaultValue="any">
                <TabsList>
                  <TabsTrigger value="any">Any stack</TabsTrigger>
                  <TabsTrigger value="supabase">With Supabase</TabsTrigger>
                </TabsList>

                <TabsContent value="any" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading text-base">Raw OAuth 2.1</CardTitle>
                      <CardDescription>
                        Works from any language. Standard authorization code flow with PKCE.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock code={OAUTH_RAW} language="bash" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        Validate access tokens with the project's JWKS at{" "}
                        <code className="font-mono">{ISSUER}/.well-known/jwks.json</code>. A confidential
                        client authenticates with HTTP Basic at the token endpoint. A public client (SPA
                        or mobile) sends no secret and relies on PKCE.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="supabase" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading text-base">If your app already runs on Supabase</CardTitle>
                      <CardDescription>
                        Add RenderDragon as a custom OAuth provider in your project, then sign in with
                        one call.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock code={OAUTH_SUPABASE} language="javascript" />
                      <p className="mt-4 text-sm text-muted-foreground">
                        Your Supabase project stores the RenderDragon session the same way it stores any
                        provider session, so `supabase.auth.getUser()` works as usual.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">What users see</CardTitle>
                  <CardDescription>
                    The consent screen lists the fields your app asked for: avatar, display name,
                    username, email, favourites, and nothing else.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Users can disconnect your app any time from their RenderDragon account, which revokes
                  the access your app holds. Ask only for what you use, because an app that asks for
                  less is an app people say yes to.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator className="my-10" />

          <section>
            <h2 className="font-heading text-xl font-bold">Questions</h2>
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="get-access">
                <AccordionTrigger className="text-left font-sans">How do I get access?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The program is invite-only. Reach out through the contact page and we will review it by
                  hand.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="read-only">
                <AccordionTrigger className="text-left font-sans">
                  Can partners write to the catalog?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  No. Partner keys read the catalog. Writing stays inside RenderDragon.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="rate">
                <AccordionTrigger className="text-left font-sans">
                  What happens if I hit the rate limit?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  You get a 429 until the window resets. Caching on <code className="font-mono">/__version</code>{" "}
                  keeps you far under it.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="scopes">
                <AccordionTrigger className="text-left font-sans">
                  Which scopes can I request?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Profile, email, and favourites. Each one appears on the consent screen with the exact
                  fields it shares.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
