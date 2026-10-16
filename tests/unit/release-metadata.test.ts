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
  version = '0.1.0',
  tag = `v${version}`,
  readme = `## 現在のバージョン\n\n**[v${version}](https://github.com/hiziriex/lab/releases/tag/v${version})**。\n`,
  changelog = `## [${version}] - 2026-10-11\n\n### Added\n\n- 機能追加\n`,
}: { version?: string; tag?: string; readme?: string; changelog?: string } = {}) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lab-release-test-'));
  directories.push(directory);
  writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ version }));
  writeFileSync(path.join(directory, 'CHANGELOG.md'), changelog);
  writeFileSync(path.join(directory, 'README.md'), readme);
  return spawnSync(process.execPath, [path.resolve('scripts/release-metadata.mjs'), tag], {
    cwd: directory,
    encoding: 'utf8',
  });
}
it('正式 tag / package / CHANGELOG / README の一致を確認する', () => {
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

it.each([
  ['表示version不一致', '**[v0.1.1](https://github.com/hiziriex/lab/releases/tag/v0.1.0)**'],
  ['Releaseリンク不一致', '**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.1)**'],
  ['表示とリンクがともに古い', '**[v0.0.9](https://github.com/hiziriex/lab/releases/tag/v0.0.9)**'],
  ['非正式version', '**[v00.1.0](https://github.com/hiziriex/lab/releases/tag/v00.1.0)**'],
  ['別repositoryのリンク', '**[v0.1.0](https://github.com/other/lab/releases/tag/v0.1.0)**'],
  ['リンク欠落', '**v0.1.0**'],
  ['version欠落', '更新履歴を参照してください。'],
  ['不正なMarkdown', '**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.0**'],
])('READMEの現在versionを拒否: %s', (_, value) => {
  const result = validate({ readme: `## 現在のバージョン\n\n${value}\n` });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('README の現在のバージョン・Release リンク');
});
it.each([
  '',
  '## Development\n\n**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.0)**\n',
  '## 現在のバージョン\n\n## Development\n\n**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.0)**\n',
  '## 現在のバージョン\n\n## 現在のバージョン\n',
  '## 現在のバージョン\n\n' +
    '**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.0)**\n'.repeat(2),
])('READMEの現在version節の欠落・重複を拒否: %s', (readme) => {
  const result = validate({ readme });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('README の現在のバージョン・Release リンク');
});
it('後続の節にある過去versionを現在versionとして扱わない', () => {
  expect(
    validate({
      readme:
        '## 現在のバージョン\n\n**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.0)**。\n' +
        '## Development\n\n**[v0.0.9](https://github.com/hiziriex/lab/releases/tag/v0.0.9)**\n',
    }).status,
  ).toBe(0);
});
it('CRLFのREADMEも検証できる', () => {
  expect(
    validate({
      readme:
        '## 現在のバージョン\r\n\r\n**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.0)**。\r\n',
    }).status,
  ).toBe(0);
});

it('次のReleaseで全metadataを更新すれば成功し、READMEの更新漏れは失敗する', () => {
  expect(validate({ version: '1.2.3' }).status).toBe(0);
  const result = validate({
    version: '1.2.3',
    readme:
      '## 現在のバージョン\n\n**[v0.1.0](https://github.com/hiziriex/lab/releases/tag/v0.1.0)**。\n',
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('README の現在のバージョン・Release リンク');
});
