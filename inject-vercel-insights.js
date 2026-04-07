const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const analyticsSrc = "/_vercel/insights/script.js";
const analyticsBootstrap = "window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };";

const snippet = [
  "<script>",
  "  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };",
  "</script>",
  '<script defer src="/_vercel/insights/script.js"></script>'
].join("\n");

function findHtmlFiles(dir, list) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      findHtmlFiles(fullPath, list);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".html")) continue;

    list.push(fullPath);
  }
}

function hasInsightsSnippet(content) {
  return content.includes(analyticsSrc) || content.includes(analyticsBootstrap);
}

function injectIntoHtml(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  if (hasInsightsSnippet(html)) return false;

  if (html.includes("</body>")) {
    html = html.replace("</body>", `${snippet}\n</body>`);
  } else {
    html += `\n${snippet}\n`;
  }

  fs.writeFileSync(filePath, html, "utf8");
  return true;
}

const htmlFiles = [];
findHtmlFiles(rootDir, htmlFiles);

let updatedCount = 0;
for (const filePath of htmlFiles) {
  if (injectIntoHtml(filePath)) updatedCount++;
}

console.log("Vercel insights injection completed.");
console.log("HTML files found: " + htmlFiles.length);
console.log("Files updated: " + updatedCount);
