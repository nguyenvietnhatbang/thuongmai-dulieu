/* eslint-disable @typescript-eslint/no-require-imports */
const path = require('path');

function createTimestampParts(date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');

  return {
    isoDate: `${year}-${month}-${day}`,
    compactDate: `${year}${month}${day}`,
    compactTime: `${hour}${minute}${second}`,
    timestamp: `${year}-${month}-${day} ${hour}:${minute}:${second}`,
  };
}

function getCliOption(args, prefix) {
  const arg = args.find((item) => item.startsWith(prefix));
  if (!arg) return undefined;
  return arg.slice(prefix.length);
}

function createRunConfig(args) {
  const now = new Date();
  const time = createTimestampParts(now);
  const flow = getCliOption(args, '--flow=') || process.env.UI_IMPORT_FLOW || 'all';
  const headless = args.includes('--headed')
    ? false
    : process.env.UI_IMPORT_HEADLESS === '0'
      ? false
      : true;

  const batchId = process.env.UI_IMPORT_BATCH_ID || `UIIMP-${time.compactDate}-${time.compactTime}`;
  const artifactRoot = path.resolve(process.cwd(), 'artifacts', 'ui-import', batchId);
  const reportDir = path.resolve(process.cwd(), 'docs', 'reports');

  return {
    flow,
    headless,
    slowMo: args.includes('--debug') ? 250 : Number(process.env.UI_IMPORT_SLOW_MO || 0),
    baseURL: process.env.UI_IMPORT_BASE_URL || 'http://localhost:3000',
    credentials: {
      email: process.env.UI_IMPORT_EMAIL || 'admin@crm.com',
      password: process.env.UI_IMPORT_PASSWORD || 'ChangeMe123!',
    },
    batchId,
    batchLabel: `[${batchId}]`,
    createdAt: time.timestamp,
    today: time.isoDate,
    artifactRoot,
    screenshotDir: path.join(artifactRoot, 'screenshots'),
    downloadDir: path.join(artifactRoot, 'downloads'),
    logPath: path.join(artifactRoot, 'run.log'),
    reportPath: path.join(reportDir, `ui-sample-import-${batchId}.md`),
    navigationTimeoutMs: 30_000,
    actionTimeoutMs: 20_000,
    responseTimeoutMs: 30_000,
  };
}

module.exports = {
  createRunConfig,
};
