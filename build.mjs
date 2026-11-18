import { copyFileSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = new URL("./draft/", import.meta.url);
const output = new URL("./dist/", import.meta.url);
const basePath = process.env.PAGES_BASE_PATH || "";
if (!/^(?:\/[A-Za-z0-9._-]+)*$/.test(basePath)) {
  throw new Error("PAGES_BASE_PATH must be empty or a slash-prefixed repository path without a trailing slash.");
}
const browserPolicies = [
  `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; upgrade-insecure-requests">`,
  `<meta name="referrer" content="strict-origin-when-cross-origin">`,
].join("\n  ");
const files = [
  "index.html", "approach.html", "work.html", "community.html", "contact.html",
  "404.html", "styles.css", "community.js", "robots.txt",
  "images/bala-home-portrait.jpg",
  "images/collaboration.jpg",
  "images/microsoft-experience.jpg",
  "images/novartis-experience.jpg",
  "images/global-ai-event.jpg",
  "images/manuscript-project.jpg",
  "images/manuscript-recognition.jpg",
  "images/learning.jpg",
  "images/azure-ai-fundamentals-badge.png",
  "images/speaking-event.jpg",
  "images/woodland.jpg",
  "images/interests-blood-moon.jpg",
  "images/interests-mountains.jpg",
];

// Remove descriptive JPEG metadata without recompressing the image data.
function withoutMetadata(bytes, name) {
  if (bytes.readUInt16BE(0) !== 0xffd8) throw new Error(`Invalid JPEG: ${name}`);
  const chunks = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error(`Invalid JPEG marker: ${name}`);
    const marker = bytes[offset + 1];
    if (marker === 0xda) return Buffer.concat([...chunks, bytes.subarray(offset)]);
    const length = bytes.readUInt16BE(offset + 2);
    const end = offset + length + 2;
    if (length < 2 || end > bytes.length) throw new Error(`Invalid JPEG segment: ${name}`);
    if (![0xe1, 0xed, 0xfe].includes(marker)) chunks.push(bytes.subarray(offset, end));
    offset = end;
  }
  throw new Error(`Missing JPEG image data: ${name}`);
}

for (const name of files) {
  if (!lstatSync(new URL(name, source)).isFile()) {
    throw new Error(`Publish source must be a regular file: ${name}`);
  }
}
if (lstatSync(output, { throwIfNoEntry: false })?.isSymbolicLink()) {
  throw new Error("Refusing to replace a symlinked dist directory.");
}
rmSync(output, { recursive: true, force: true });
mkdirSync(new URL("images/", output), { recursive: true });

for (const name of files) {
  const from = new URL(name, source);
  const to = new URL(name, output);
  if (name.endsWith(".jpg")) {
    writeFileSync(to, withoutMetadata(readFileSync(from), name));
  } else if (name.endsWith(".html")) {
    const html = readFileSync(from, "utf8")
      .replace("<head>", `<head>\n  ${browserPolicies}`)
      .replaceAll('href="/', `href="${basePath}/`);
    writeFileSync(to, html);
  } else {
    copyFileSync(from, to);
  }
}
console.log(`Built ${files.length} allowlisted public files in ${fileURLToPath(output)}`);
