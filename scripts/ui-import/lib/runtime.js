/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs/promises');
const path = require('path');

function createRunState(config) {
  return {
    config,
    startedAt: new Date().toISOString(),
    steps: [],
    entities: {},
    notes: [],
    warnings: [],
    errors: [],
    dialogs: [],
    logLines: [],
    coverage: {},
    hasFailures: false,
  };
}

function pushLog(state, level, message) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`;
  state.logLines.push(line);
  const printer = level === 'ERROR' ? console.error : console.log;
  printer(line);
}

function recordNote(state, note) {
  state.notes.push(note);
  pushLog(state, 'INFO', note);
}

function recordWarning(state, warning) {
  state.warnings.push(warning);
  pushLog(state, 'WARN', warning);
}

function addEntity(state, type, entity) {
  if (!state.entities[type]) {
    state.entities[type] = [];
  }

  state.entities[type].push(entity);
}

function addCoverage(state, key, message) {
  state.coverage[key] = message;
  pushLog(state, 'INFO', `COVERAGE: ${message}`);
}

function addDialog(state, dialog) {
  state.dialogs.push(dialog);
}

function startStep(state, flow, title) {
  const step = {
    flow,
    title,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    status: 'running',
    message: '',
    error: '',
    screenshotPath: '',
  };

  state.steps.push(step);
  pushLog(state, 'INFO', `${flow.toUpperCase()}: ${title}`);
  return step;
}

function completeStep(state, step, status, options = {}) {
  step.status = status;
  step.finishedAt = new Date().toISOString();
  step.message = options.message || '';
  step.error = options.error || '';
  step.screenshotPath = options.screenshotPath || '';

  if (status === 'failed') {
    state.hasFailures = true;
    state.errors.push(`${step.flow}: ${step.title} - ${step.error || step.message}`);
    pushLog(state, 'ERROR', `${step.flow.toUpperCase()}: ${step.title} failed${step.error ? ` - ${step.error}` : ''}`);
    return;
  }

  if (status === 'skipped') {
    pushLog(state, 'WARN', `${step.flow.toUpperCase()}: ${step.title} skipped${step.message ? ` - ${step.message}` : ''}`);
    return;
  }

  pushLog(state, 'INFO', `${step.flow.toUpperCase()}: ${step.title} passed${step.message ? ` - ${step.message}` : ''}`);
}

async function flushLogFile(state) {
  await fs.mkdir(path.dirname(state.config.logPath), { recursive: true });
  await fs.writeFile(state.config.logPath, `${state.logLines.join('\n')}\n`, 'utf8');
}

module.exports = {
  addCoverage,
  addDialog,
  addEntity,
  completeStep,
  createRunState,
  flushLogFile,
  pushLog,
  recordNote,
  recordWarning,
  startStep,
};
