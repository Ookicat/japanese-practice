const fs = require("fs");
const path = require("path");

const rootDir = __dirname;
const addonFileName = "quiz-review-addon.js";
const addonPath = path.join(rootDir, addonFileName);

if (!fs.existsSync(addonPath)) {
  console.error("Missing " + addonFileName + " in project root.");
  process.exit(1);
}

function findInteractiveHtmlFiles(dir, list) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      findInteractiveHtmlFiles(fullPath, list);
      continue;
    }

    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith("-interactive.html")) continue;

    list.push(fullPath);
  }
}

function toWebPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function ensureAddonScript(filePath) {
  let html = fs.readFileSync(filePath, "utf8");

  if (html.includes(addonFileName)) {
    return false;
  }

  const relDir = path.dirname(filePath);
  let relPath = path.relative(relDir, addonPath);
  relPath = toWebPath(relPath);
  const scriptTag = "<script defer src=\"" + relPath + "\"></script>";

  if (html.includes("</body>")) {
    html = html.replace("</body>", scriptTag + "\n</body>");
  } else {
    html = html + "\n" + scriptTag + "\n";
  }

  fs.writeFileSync(filePath, html, "utf8");
  return true;
}

const files = [];
findInteractiveHtmlFiles(rootDir, files);

let updatedCount = 0;
for (const file of files) {
  if (ensureAddonScript(file)) updatedCount++;
}

console.log("Review addon injection completed.");
console.log("Interactive files found: " + files.length);
console.log("Files updated: " + updatedCount);
