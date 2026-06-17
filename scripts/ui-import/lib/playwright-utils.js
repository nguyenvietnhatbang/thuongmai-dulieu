/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs/promises');
const path = require('path');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function controlByLabel(page, labelText, controlSelector) {
  return page.locator('label', { hasText: labelText }).locator('..').locator(controlSelector).first();
}

async function attachDialogHandler(page, state) {
  page.on('dialog', async (dialog) => {
    state.dialogs.push({
      type: dialog.type(),
      message: dialog.message(),
      time: new Date().toISOString(),
    });

    try {
      await dialog.accept();
    } catch {
      // Ignore stale dialog failures
    }
  });
}

async function gotoPath(page, targetPath) {
  await page.goto(targetPath, { waitUntil: 'networkidle' });
}

async function login(page, config) {
  await gotoPath(page, `${config.baseURL}/login`);
  await page.locator('input[type="email"]').fill(config.credentials.email);
  await page.locator('input[type="password"]').fill(config.credentials.password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: config.navigationTimeoutMs }),
    page.getByRole('button', { name: 'Đăng nhập' }).click(),
  ]);
  await page.waitForLoadState('networkidle');
}

async function clickAndCaptureJson(page, action, matcher, timeout) {
  const [response] = await Promise.all([
    page.waitForResponse(matcher, { timeout }),
    action(),
  ]);

  const json = await response.json();
  if (!json.success) {
    throw new Error(json.error || json.details || 'API action failed');
  }

  return json;
}

async function fillSearch(page, placeholder, value, responseMatcher, timeout) {
  const input = page.locator(`input[placeholder="${placeholder}"]`).first();
  await input.fill('');

  const waitForResponse = responseMatcher
    ? page.waitForResponse(responseMatcher, { timeout })
    : Promise.resolve(null);

  await input.fill(value);
  if (responseMatcher) {
    const response = await waitForResponse;
    await response.json().catch(() => null);
  }
}

async function captureFailureScreenshot(page, screenshotDir, prefix) {
  await ensureDir(screenshotDir);
  const safePrefix = prefix.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  const filePath = path.join(screenshotDir, `${safePrefix}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function runStep(state, page, flow, title, task, options = {}) {
  const step = require('./runtime').startStep(state, flow, title);

  try {
    const result = await task(step);
    require('./runtime').completeStep(state, step, 'passed', {
      message: options.successMessage || '',
    });
    return result;
  } catch (error) {
    const screenshotPath = await captureFailureScreenshot(
      page,
      state.config.screenshotDir,
      `${flow}-${title}`
    ).catch(() => '');

    require('./runtime').completeStep(state, step, options.continueOnError ? 'failed' : 'failed', {
      error: error instanceof Error ? error.message : String(error),
      screenshotPath,
    });

    if (options.continueOnError) {
      return null;
    }

    throw error;
  }
}

async function waitForTableText(page, text, timeout) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

async function selectOptionByText(locator, labelText) {
  await locator.selectOption({ label: labelText });
}

async function selectOptionContainingText(locator, textFragment) {
  const value = await locator.locator('option').evaluateAll((options, fragment) => {
    const match = options.find((option) => option.textContent && option.textContent.includes(fragment));
    return match ? match.getAttribute('value') : null;
  }, textFragment);

  if (!value) {
    throw new Error(`No option found containing text: ${textFragment}`);
  }

  await locator.selectOption(value);
}

async function findRowByText(page, text) {
  return page.locator('tr', { hasText: text }).first();
}

function buildContainsResponseMatcher(urlPart, method = 'GET') {
  return (response) => response.url().includes(urlPart) && response.request().method() === method;
}

function buildPathResponseMatcher(pathname, method = 'GET') {
  const normalized = escapeRegExp(pathname);
  const pattern = new RegExp(`${normalized}(\\?|$)`);

  return (response) => {
    if (response.request().method() !== method) return false;

    try {
      const url = new URL(response.url());
      return pattern.test(url.pathname + url.search);
  } catch {
      return response.url().includes(pathname);
    }
  };
}

module.exports = {
  attachDialogHandler,
  buildContainsResponseMatcher,
  buildPathResponseMatcher,
  captureFailureScreenshot,
  clickAndCaptureJson,
  controlByLabel,
  ensureDir,
  fillSearch,
  findRowByText,
  gotoPath,
  login,
  runStep,
  selectOptionContainingText,
  selectOptionByText,
  waitForTableText,
};
