import fs from 'node:fs';
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const tag = process.argv[2] || `v${pkg.version}`;
if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag) || tag !== `v${pkg.version}`)
  throw new Error('正式 SemVer tag と package version が一致しません');
const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
const section = changelog.split(`## [${pkg.version}]`)[1]?.split('\n## [')[0]?.trim();
if (!section) throw new Error('CHANGELOG に対象 version がありません');
fs.writeFileSync('/tmp/lab-release-notes.md', section.replace(/^ - \d{4}-\d{2}-\d{2}\n/, ''));
console.log(`Release metadata OK: ${tag}`);
