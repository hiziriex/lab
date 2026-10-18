module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview --host 127.0.0.1 --port 4322 --ignore-lock',
      startServerReadyPattern: 'localhost|127.0.0.1',
      url: [
        'http://127.0.0.1:4322/lab/',
        'http://127.0.0.1:4322/lab/tools/voltage-divider/',
        'http://127.0.0.1:4322/lab/about/',
        'http://127.0.0.1:4322/lab/tools/e-series/',
      ],
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox' },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.95 }],
        'categories:seo': ['warn', { minScore: 0.95 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/reports' },
  },
};
