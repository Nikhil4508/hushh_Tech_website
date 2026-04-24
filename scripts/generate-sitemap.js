import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITE_URL = "https://hushhTech.com";
const SITEMAP_PATH = path.join(__dirname, "../public/sitemap.xml");
const staticPages = ["/", "/about", "/contact", "/blog", "/privacy-policy", "/terms-of-service"];

// Additional community routes based on observed URL structure in posts.ts
const communityRoutes = [
  // Market updates
  "/community/market/updates",
  "/community/market/alpha-aloha-fund-update",
  
  // Funds
  "/community/funds/hushh-technology-fund",
  "/community/funds/renaissance-tech",
  "/community/funds/hushh-alpha-fund-nav-update",
  
  // General
  "/community/general/manifesto",
  "/community/general/ai-infrastructure-thesis",
  "/community/general/fund-afaq",
  "/community/general/hushh-fund-faq",
  "/community/general/hushh-employee-champion-handbook",
  "/community/general/hushhtech-prospectus",
  "/community/general/compensation-report",
  
  // Product updates
  "/community/product/product-updates",
  "/community/product/hushh-wallet",
  
  // Investor relations
  "/community/investor-relations/investor-faq/charlie-munger-edition",
  "/community/investors-faq/shared-class-explanation",
  "/community/investors-faq/withdrawal-schedule",
  "/community/investors-faq/investor-suitability-questionnarie",
  "/community/investors-news/market-wrap",
  "/community/investment-strategies/sell-the-wall",
  "/community/investment-strategy/hushh-alpha-fund-growth-plan",
  "/community/investment-strategy/investment-framework-renting-maximum-income",
  "/community/news/investment-perspective"
];

function readExistingLastMods() {
  const candidateContents = [];

  try {
    candidateContents.push(execSync("git show HEAD:public/sitemap.xml", { encoding: "utf8" }));
  } catch {
    // Fall back to the current working-tree sitemap when the repo has no tracked file yet.
  }

  if (fs.existsSync(SITEMAP_PATH)) {
    candidateContents.push(fs.readFileSync(SITEMAP_PATH, "utf8"));
  }

  for (const existingSitemap of candidateContents) {
    const entries = [...existingSitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>/gs)];
    if (entries.length > 0) {
      return new Map(entries.map(([, loc, lastmod]) => [loc.trim(), lastmod.trim()]));
    }
  }

  return new Map();
}

function getStableLastMod(existingLastMods, url, fallbackLastMod) {
  return existingLastMods.get(url) || fallbackLastMod;
}

const generateSitemap = () => {
  console.log("🔹 Generating sitemap...");
  const existingLastMods = readExistingLastMods();
  const fallbackLastMod = fs.statSync(path.join(__dirname, "../package.json")).mtime.toISOString();
  
  // Use a Map to deduplicate URLs and store their properties
  const urlMap = new Map();

  // 1. Static Pages
  staticPages.forEach((page) => {
    const url = `${SITE_URL}${page}`;
    urlMap.set(url, {
      lastmod: getStableLastMod(existingLastMods, url, fallbackLastMod),
      changefreq: "daily",
      priority: "0.7"
    });
  });

  // 2. Scan Directories for Posts
  const publicPostDirectories = [
    path.join(__dirname, "../src/content/posts/market"),
    path.join(__dirname, "../src/content/posts/funds"),
    path.join(__dirname, "../src/content/posts/general"),
    path.join(__dirname, "../src/content/posts/investors-faq"),
    path.join(__dirname, "../src/content/posts/product")
  ];
  
  let scannedCount = 0;
  publicPostDirectories.forEach(directory => {
    if (fs.existsSync(directory)) {
      const category = path.basename(directory);
      const files = fs.readdirSync(directory);
      
      files.forEach(file => {
        if (!file.endsWith('.tsx') && !file.endsWith('.jsx')) return;
        const fileName = path.basename(file, path.extname(file));
        const slug = fileName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        const lastMod = stats.mtime.toISOString();
        const url = `${SITE_URL}/community/${category}/${slug}`;
        
        urlMap.set(url, {
          lastmod: lastMod,
          changefreq: "weekly",
          priority: "0.8"
        });
        scannedCount++;
      });
    }
  });

  // 3. Manual Community Routes (only if not already scanned)
  communityRoutes.forEach((route) => {
    const url = `${SITE_URL}${route}`;
    if (!urlMap.has(url)) {
      urlMap.set(url, {
        lastmod: getStableLastMod(existingLastMods, url, fallbackLastMod),
        changefreq: "weekly",
        priority: "0.8"
      });
    }
  });

  // Generate XML content
  const urlEntries = Array.from(urlMap.entries()).map(([url, props]) => `
      <url>
        <loc>${url}</loc>
        <lastmod>${props.lastmod}</lastmod>
        <changefreq>${props.changefreq}</changefreq>
        <priority>${props.priority}</priority>
      </url>`).join("");

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urlEntries}
    </urlset>`;

  fs.writeFileSync(SITEMAP_PATH, sitemapContent);

  console.log(`✅ Sitemap successfully generated at ${SITEMAP_PATH}`);
  console.log(`✅ Included ${urlMap.size} unique URLs (${scannedCount} scanned from posts)`);
  console.log(`🔎 Verifying file: ${fs.existsSync(SITEMAP_PATH) ? "✅ Exists" : "❌ Not Found"}`);
};

generateSitemap();
