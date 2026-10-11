import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// WSL を Windows Chrome とみなす chrome-launcher の自動起動を避ける。
// 導入済みの Playwright Chromium を起動し、LHCI はそのポートへ接続する。
const require = createRequire(import.meta.url);
const profile = await mkdtemp(path.join(tmpdir(), 'lab-lighthouse-'));
let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    headless: true,
    args: ['--remote-debugging-port=0'],
  });
  let port;
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0];
      if (port && /^\d+$/.test(port)) break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await delay(100);
  }
  if (!port || !/^\d+$/.test(port)) throw new Error('Chromium の検証ポートを取得できません');
  const child = spawn(
    process.execPath,
    [require.resolve('@lhci/cli/src/cli.js'), 'autorun', `--collect.settings.port=${port}`],
    {
      stdio: 'inherit',
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
    },
  );
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
} finally {
  await context?.close();
  await rm(profile, { recursive: true, force: true });
}
