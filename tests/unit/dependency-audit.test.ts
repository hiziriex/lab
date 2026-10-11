import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evaluateAudit } from '../../scripts/dependency-audit.mjs';
const policy = JSON.parse(readFileSync('scripts/audit-exceptions.json', 'utf8')) as {
  expiresAt: string;
  advisories: Record<string, { module: string; findings: unknown[] }>;
};
function fixture() {
  return {
    advisories: Object.fromEntries(
      Object.entries(policy.advisories).map(([id, item]) => [
        id,
        {
          github_advisory_id: id,
          module_name: item.module,
          severity: 'high',
          patched_versions: null as string | null,
          patched_versions_unpublished: true,
          findings: structuredClone(item.findings) as {
            version: string;
            paths: string[];
            dev: boolean;
          }[],
        },
      ]),
    ),
    metadata: { vulnerabilities: { high: 3, critical: 0 } },
  };
}
const now = new Date('2026-10-11T00:00:00Z');
describe('期限付き監査例外', () => {
  it('承認された3件だけを期限内で許可', () => {
    const result = evaluateAudit(fixture(), policy, now);
    expect(result.failures).toEqual([]);
    expect(result.exceptions).toHaveLength(3);
  });
  it('期限当日は許可し翌日から失敗', () => {
    expect(evaluateAudit(fixture(), policy, new Date(policy.expiresAt)).failures).toEqual([]);
    expect(
      evaluateAudit(fixture(), policy, new Date('2026-11-11T00:00:00+09:00')).failures,
    ).not.toEqual([]);
  });
  it.each(['high', 'critical'])('新規 %s は失敗', (severity) => {
    const report = fixture();
    const first = Object.values(report.advisories)[0]!;
    report.advisories.new = { ...first, github_advisory_id: 'GHSA-new', severity };
    report.metadata.vulnerabilities[severity as 'high' | 'critical']++;
    expect(evaluateAudit(report, policy, now).failures).not.toEqual([]);
  });
  it('承認済みIDでもCriticalへ変更されたら失敗', () => {
    const report = fixture();
    Object.values(report.advisories)[0]!.severity = 'critical';
    report.metadata.vulnerabilities = { high: 2, critical: 1 };
    expect(evaluateAudit(report, policy, now).failures).not.toEqual([]);
  });
  it('修正版が公開されたら失敗', () => {
    const report = fixture();
    Object.values(report.advisories)[0]!.patched_versions = '>=2.0.2';
    expect(evaluateAudit(report, policy, now).failures).not.toEqual([]);
  });
  it.each(['version', 'path', 'production'])('依存条件の変更 %s は失敗', (change) => {
    const report = fixture();
    const finding = Object.values(report.advisories)[0]!.findings[0]!;
    if (change === 'version') finding.version = '2.0.2';
    if (change === 'path') finding.paths.push('.>new>extract-zip');
    if (change === 'production') finding.dev = false;
    expect(evaluateAudit(report, policy, now).failures).not.toEqual([]);
  });
  it('不正な監査結果や件数不一致は失敗', () => {
    expect(evaluateAudit({}, policy, now).failures).not.toEqual([]);
    const report = fixture();
    report.metadata.vulnerabilities.high = 0;
    expect(evaluateAudit(report, policy, now).failures).not.toEqual([]);
  });
});
