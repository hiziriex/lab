import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const summary = { js: { raw: 0, gzip: 0 }, css: { raw: 0, gzip: 0 } };
for (const file of files(process.argv[2] || 'dist')) {
  const kind = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : undefined;
  if (!kind) continue;
  const data = fs.readFileSync(file);
  summary[kind].raw += data.length;
  summary[kind].gzip += gzipSync(data).length;
}
if (process.argv.includes('--json')) console.log(JSON.stringify(summary));
else {
  const baseline = process.env.BUNDLE_BASE
    ? JSON.parse(fs.readFileSync(process.env.BUNDLE_BASE, 'utf8'))
    : null;
  console.log('| 種類 | raw bytes | gzip bytes | gzip 差分 |\n|---|---:|---:|---:|');
  for (const [kind, size] of Object.entries(summary))
    console.log(
      `| ${kind} | ${size.raw} | ${size.gzip} | ${baseline ? size.gzip - baseline[kind].gzip : '比較元なし'} |`,
    );
}
