/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs/promises');
const path = require('path');

const KNOWN_GAPS = [
  'Chưa tự động cover sâu các tab phụ của khách hàng như người liên hệ, ghi chú nội bộ và file đính kèm.',
  'Chưa xác minh luồng thông báo nội bộ cho project notes hoặc notification bell bằng UI.',
  'Chưa đi qua quy trình đóng dự án/nghiệm thu vì bộ import hiện ưu tiên tạo dữ liệu đầu vào cốt lõi.',
  'Chưa chạy xuất file công nợ/báo giá PDF như một tiêu chí pass chính; chỉ tập trung vào dữ liệu nghiệp vụ phát sinh.',
  'Một số ý tưởng trong docs/huongdan.md mới tồn tại ở mức khung hoặc tản mác giữa nhiều màn hình, nên report sẽ đánh dấu là chưa cover đầy đủ thay vì giả lập thủ công ngoài UI.',
];

function groupStepsByStatus(steps, status) {
  return steps.filter((step) => step.status === status);
}

function formatEntities(entities) {
  const lines = [];

  for (const [type, items] of Object.entries(entities)) {
    if (!items.length) continue;
    lines.push(`- ${type}:`);
    for (const item of items) {
      const summary = Object.entries(item)
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      lines.push(`  - ${summary}`);
    }
  }

  return lines.length ? lines.join('\n') : '- Không có bản ghi nào được ghi nhận.';
}

function createMarkdownReport(state) {
  const passed = groupStepsByStatus(state.steps, 'passed');
  const failed = groupStepsByStatus(state.steps, 'failed');
  const skipped = groupStepsByStatus(state.steps, 'skipped');

  const completedLines = passed.length
    ? passed.map((step) => `- [${step.flow}] ${step.title}${step.message ? `: ${step.message}` : ''}`).join('\n')
    : '- Chưa có bước nào hoàn thành.';

  const failedLines = failed.length
    ? failed.map((step) => `- [${step.flow}] ${step.title}: ${step.error || step.message}${step.screenshotPath ? ` (screenshot: ${step.screenshotPath})` : ''}`).join('\n')
    : '- Không có lỗi nào được ghi nhận.';

  const skippedLines = skipped.length
    ? skipped.map((step) => `- [${step.flow}] ${step.title}: ${step.message || 'Đã bỏ qua.'}`).join('\n')
    : '- Không có bước nào bị bỏ qua.';

  const warnings = state.warnings.length
    ? state.warnings.map((item) => `- ${item}`).join('\n')
    : '- Không có cảnh báo bổ sung.';

  const notes = state.notes.length
    ? state.notes.map((item) => `- ${item}`).join('\n')
    : '- Không có ghi chú bổ sung.';

  const missingCoverage = KNOWN_GAPS.map((item) => `- ${item}`).join('\n');

  return `# Báo cáo import dữ liệu mẫu qua UI

## Mục tiêu
- Chạy Playwright headless như một tester để đăng nhập vào hệ thống, tạo batch dữ liệu mẫu mới và đi qua các luồng nghiệp vụ đang có trên UI.
- Batch hiện tại: \`${state.config.batchId}\`
- Thời điểm chạy: \`${state.config.createdAt}\`
- Flow được chọn: \`${state.config.flow}\`

## Batch dữ liệu
${formatEntities(state.entities)}

## Đã hoàn thành
${completedLines}

## Chưa đạt
${skippedLines}

## Lỗi phát hiện
${failedLines}

## Thiếu so với docs/huongdan.md
${missingCoverage}

## Khuyến nghị
${warnings}

## Ghi chú thêm
${notes}
`;
}

async function writeMarkdownReport(state) {
  const report = createMarkdownReport(state);
  await fs.mkdir(path.dirname(state.config.reportPath), { recursive: true });
  await fs.writeFile(state.config.reportPath, report, 'utf8');
  return state.config.reportPath;
}

module.exports = {
  writeMarkdownReport,
};
