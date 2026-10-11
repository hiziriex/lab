import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});
function validate({
  tag = 'v0.1.0',
  changelog = '## [0.1.0] - 2026-10-11\n\n### Added\n\n- 機能追加\n',
} = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lab-release-test-'));
  directories.push(directory);
  writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ version: '0.1.0' }));
  writeFileSync(path.join(directory, 'CHANGELOG.md'), changelog);
  return spawnSync(process.execPath, [path.resolve('scripts/release-metadata.mjs'), tag], {
    cwd: directory,
    encoding: 'utf8',
  });
}
it('正式 tag / package / CHANGELOG の一致を確認する', () => {
  expect(validate().status).toBe(0);
  expect(readFileSync('/tmp/lab-release-notes.md', 'utf8')).toBe('### Added\n\n- 機能追加');
});
it.each(['v0.1.1', 'v01.1.0', 'v0.1.0-rc.1', '0.1.0', 'v0.1.0;echo invalid'])(
  '不一致・非正式 tag を拒否: %s',
  (tag) => expect(validate({ tag }).status).toBe(1),
);
it.each([
  '## [Unreleased]\n- 変更\n',
  '## [0.1.0]\n\n## [0.0.9]\n- 以前の変更\n',
  '## [0.1.0]invalid\n- 変更\n',
])('対象 section がない・空・不正な CHANGELOG を拒否: %s', (changelog) =>
  expect(validate({ changelog }).status).toBe(1),
);
