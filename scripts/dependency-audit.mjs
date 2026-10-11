import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// 承認済みの依存経路に限定する。監査形式の変更や取得失敗は安全側で失敗する。
export function evaluateAudit(report, policy, now = new Date()) {
  const failures = [];
  const exceptions = [];
  const deadline = new Date(policy.expiresAt);
  if (!Number.isFinite(deadline.getTime()) || !Number.isFinite(now.getTime()) || now > deadline)
    failures.push('監査例外の期限切れまたは不正な期限');
  if (!report?.advisories || !report.metadata?.vulnerabilities || report.error)
    return { failures: [...failures, '監査結果の形式が不正'], exceptions };
  const counts = { high: 0, critical: 0 };
  for (const advisory of Object.values(report.advisories)) {
    if (!['info', 'low', 'moderate', 'high', 'critical'].includes(advisory.severity)) {
      failures.push('未知の severity');
      continue;
    }
    if (!['high', 'critical'].includes(advisory.severity)) continue;
    counts[advisory.severity]++;
    const id = advisory.github_advisory_id;
    const approved = policy.advisories[id];
    if (advisory.severity !== 'high' || !approved || approved.module !== advisory.module_name) {
      failures.push(`${id}: 未承認の High / Critical`);
      continue;
    }
    if (advisory.patched_versions !== null || advisory.patched_versions_unpublished !== true) {
      failures.push(`${id}: 修正版を再評価して例外を解除してください`);
      continue;
    }
    const findings = advisory.findings;
    if (
      !Array.isArray(findings) ||
      findings.length === 0 ||
      findings.some(
        (finding) =>
          finding.dev !== true ||
          finding.bundled !== false ||
          finding.optional !== false ||
          !Array.isArray(finding.paths) ||
          finding.paths.length === 0 ||
          finding.paths.some(
            (path) =>
              !approved.findings.some(
                (known) => known.version === finding.version && known.paths.includes(path),
              ),
          ),
      )
    ) {
      failures.push(`${id}: バージョン・依存経路・開発依存条件の変化を再評価してください`);
      continue;
    }
    exceptions.push(id);
  }
  for (const severity of ['high', 'critical'])
    if (counts[severity] !== report.metadata.vulnerabilities[severity])
      failures.push(`${severity}: 監査件数が一致しません`);
  return { failures, exceptions };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const policy = JSON.parse(
      readFileSync(new URL('./audit-exceptions.json', import.meta.url), 'utf8'),
    );
    const audit = spawnSync('pnpm', ['audit', '--json'], { encoding: 'utf8', timeout: 120_000 });
    if (audit.error || ![0, 1].includes(audit.status))
      throw new Error(audit.stderr || '監査取得失敗');
    // Low / Moderate を含めて監査結果を省略せず表示する。
    console.log(audit.stdout);
    const result = evaluateAudit(JSON.parse(audit.stdout), policy);
    for (const id of result.exceptions)
      console.log(`承認済み例外: ${id}（期限 ${policy.expiresAt}）`);
    for (const failure of result.failures) console.error(failure);
    process.exitCode = result.failures.length ? 1 : 0;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
