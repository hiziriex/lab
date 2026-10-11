import { execFileSync } from 'node:child_process';

export default function checkJapaneseFonts() {
  if (process.platform === 'linux')
    execFileSync('bash', ['scripts/check-japanese-fonts.sh'], { stdio: 'inherit' });
}
