#!/usr/bin/env node
import { randomBytes } from "node:crypto";

const id = process.argv[2];
if (!id) {
  console.error("usage: node workers/api-router/scripts/new-client.mjs <client-id|renderdragon-gateway>");
  process.exit(1);
}

const secret = randomBytes(32).toString("hex");
const adminKey = process.env.ADMIN_KEY ?? "<ADMIN_KEY>";
const base = (process.env.ROUTER_ORIGIN ?? "https://api.codersoft.xyz").replace(/\/$/, "");

console.log(`client id : ${id}`);
console.log(`secret    : ${secret}`);
console.log("");
console.log("Register it with:");
console.log(
  `curl -X PUT ${base}/__admin/clients/${id} \\\n` +
    `  -H "X-Admin-Key: ${adminKey}" -H 'content-type: application/json' \\\n` +
    `  -d '{"secret":"${secret}","description":"${id}"}'`,
);
console.log("");
console.log("For the browser gateway, also set the same value:");
console.log(`  cd workers/assets-gateway && pnpm wrangler secret put GATEWAY_SECRET   # paste: ${secret}`);
