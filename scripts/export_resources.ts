import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase credentials missing in .env (need SUPABASE_SERVICE_ROLE_KEY)",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MCICONS_BASE_URLS = [
  "https://assets.codersoft.xyz",
  "https://hamburger-api.powernplant101-c6b.workers.dev",
];

const fetchMcicons = async () => {
  for (const base of MCICONS_BASE_URLS) {
    try {
      const response = await fetch(`${base}/mcicons`);
      if (!response.ok) {
        console.warn(`Failed to fetch mcicons from ${base}: ${response.status}`);
        continue;
      }
      const data = await response.json();
      const files = Array.isArray(data?.files) ? data.files : [];
      return files
        .map((file) => {
          const rawTitle = String(file.title || "").replace(/_/g, " ");
          const title = rawTitle.replace(/\.[^/.]+$/, "").trim();
          return {
            id: `mcicons-${file.id ?? title ?? "unknown"}`,
            title,
            credit: file.credit || "",
            filetype: file.ext || file.filetype,
            download_url: file.url,
            subcategory: file.subcategory,
          };
        })
        .filter((item) => item.title);
    } catch (error) {
      console.warn(`Failed to fetch mcicons from ${base}:`, error);
    }
  }
  return [];
};

async function exportResources() {
  console.log("Fetching resources...");
  const { data, error } = await supabase
    .from("resources")
    .select(
      "id,title,category,subcategory,credit,filetype,download_url,preview_url,image_url,software,description",
    );

  if (error) {
    console.error("Error fetching data:", error);
    process.exit(1);
  }

  // Group by category for the structure the app likes
  const grouped = data.reduce(
    (acc, resource) => {
      const cat = resource.category || "uncategorized";
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push({
        id: resource.id,
        title: resource.title,
        credit: resource.credit,
        filetype: resource.filetype,
        download_url: resource.download_url,
        preview_url: resource.preview_url,
        image_url: resource.image_url,
        subcategory: resource.subcategory,
        software: resource.software,
        description: resource.description,
      });
      return acc;
    },
    {} as Record<string, Array<Record<string, unknown>>>,
  );

  const mcicons = await fetchMcicons();
  if (mcicons.length > 0) {
    const key = "minecraft-icons";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(...mcicons);
  }

  const outputDir = "public/resources";
  fs.mkdirSync(outputDir, { recursive: true });

  const index = {
    generated_at: new Date().toISOString(),
    categories: {} as Record<string, { count: number; file: string }>,
  };

  const allResources: Array<Record<string, unknown>> = [];

  Object.entries(grouped).forEach(([category, items]) => {
    const file = `${category}.json`;
    const filePath = path.join(outputDir, file);
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2));
    index.categories[category] = {
      count: items.length,
      file: `resources/${file}`,
    };
    allResources.push(
      ...items.map((item: Record<string, unknown>) => ({
        ...item,
        category,
      })),
    );
  });

  fs.writeFileSync(
    "public/resources.index.json",
    JSON.stringify(index, null, 2),
  );
  fs.writeFileSync(
    "public/resources.all.json",
    JSON.stringify(allResources, null, 2),
  );
  console.log(
    `Exported ${Object.keys(index.categories).length} categories to ${outputDir}`,
  );
}

exportResources().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
