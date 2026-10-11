import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tag = process.argv[2] || `v${pkg.version}`;
if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || tag !== `v${pkg.version}`)
  throw new Error('正式 SemVer tag と package version が一致しません');
const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const lines = changelog.split(/\r?\n/);
const heading = `## [${pkg.version}]`;
const start = lines.findIndex(
  (line) =>
    line === heading ||
    (line.startsWith(`${heading} - `) &&
      /^\d{4}-\d{2}-\d{2}$/.test(line.slice(heading.length + 3))),
);
const end = lines.findIndex((line, index) => index > start && line.startsWith('## ['));
const section =
  start === -1
    ? undefined
    : lines
        .slice(start + 1, end === -1 ? undefined : end)
        .join('\n')
        .trim();
if (!section) throw new Error('CHANGELOG に対象 version がありません');
fs.writeFileSync('/tmp/lab-release-notes.md', section);
console.log(`Release metadata OK: ${tag}`);
