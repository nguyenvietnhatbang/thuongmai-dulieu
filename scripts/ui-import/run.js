/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require('playwright');

const { createRunConfig } = require('./lib/config');
const { writeMarkdownReport } = require('./lib/report');
const {
  createRunState,
  flushLogFile,
  pushLog,
  recordNote,
  startStep,
  completeStep,
} = require('./lib/runtime');
const {
  attachDialogHandler,
  ensureDir,
  login,
} = require('./lib/playwright-utils');
const { runServiceFlow } = require('./flows/service');
const { runCommerceFlow } = require('./flows/commerce');

async function main() {
  const config = createRunConfig(process.argv.slice(2));
  const state = createRunState(config);

  await ensureDir(config.screenshotDir);
  await ensureDir(config.downloadDir);

  const browser = await chromium.launch({
    headless: config.headless,
    slowMo: config.slowMo,
  });

  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 1200 },
  });

  const page = await context.newPage();
  await attachDialogHandler(page, state);

  let reportPath = config.reportPath;

  try {
    const loginStep = startStep(state, 'setup', 'Đăng nhập hệ thống bằng tài khoản admin');
    try {
      await login(page, config);
      completeStep(state, loginStep, 'passed', {
        message: `Đăng nhập thành công vào ${config.baseURL}`,
      });
    } catch (error) {
      completeStep(state, loginStep, 'failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    if (config.flow === 'all' || config.flow === 'service') {
      await runServiceFlow(page, state, config);
    }

    if (config.flow === 'all' || config.flow === 'commerce') {
      await runCommerceFlow(page, state, config);
    }

    recordNote(state, `Playwright dialog log count: ${state.dialogs.length}`);
  } catch (error) {
    pushLog(state, 'ERROR', error instanceof Error ? error.stack || error.message : String(error));
  } finally {
    try {
      reportPath = await writeMarkdownReport(state);
      pushLog(state, 'INFO', `Markdown report saved to ${reportPath}`);
    } catch (error) {
      pushLog(state, 'ERROR', `Failed to write markdown report: ${error instanceof Error ? error.message : String(error)}`);
    }

    await flushLogFile(state).catch(() => undefined);
    await context.close().catch(() => undefined);
    await browser.close().catch(() => undefined);
  }

  const passedCount = state.steps.filter((step) => step.status === 'passed').length;
  const failedCount = state.steps.filter((step) => step.status === 'failed').length;
  const skippedCount = state.steps.filter((step) => step.status === 'skipped').length;

  pushLog(
    state,
    'INFO',
    `Run summary: passed=${passedCount}, failed=${failedCount}, skipped=${skippedCount}, report=${reportPath}`
  );

  if (failedCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
