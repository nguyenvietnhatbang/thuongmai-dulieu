/* eslint-disable @typescript-eslint/no-require-imports */
const {
  addEntity,
  recordNote,
  recordWarning,
} = require('../lib/runtime');
const {
  buildContainsResponseMatcher,
  buildPathResponseMatcher,
  clickAndCaptureJson,
  controlByLabel,
  fillSearch,
  gotoPath,
  runStep,
  waitForTableText,
} = require('../lib/playwright-utils');

function createServiceData(config) {
  const phoneSuffix = config.batchId.replace(/\D/g, '').slice(-8).padStart(8, '0');

  return {
    customer: {
      code: `${config.batchId}-CUS-SVC`,
      name: `${config.batchLabel} Khach hang dich vu`,
      phone: `09${phoneSuffix}`,
      email: `${config.batchId.toLowerCase()}-service@example.com`,
      address: 'Toa nha Automation, Quan 1, TP.HCM',
      notes: 'Khach hang mau duoc tao bang Playwright UI import.',
    },
    opportunity: {
      code: `${config.batchId}-OPP`,
      title: `${config.batchLabel} Co hoi tu van chuyen doi so`,
      expectedValue: '125000000',
      needDescription: 'Tu van CRM, quy trinh ban hang va trien khai van hanh.',
      notes: 'Theo doi tu batch UI import.',
    },
    quote: {
      code: `${config.batchId}-Q`,
      quoteNumber: `${config.batchId}-QUO`,
      termsNote: 'Thanh toan 50% khi ky hop dong, 50% khi nghiem thu.',
    },
    reminder: {
      content: `${config.batchLabel} Goi nhac lich cham soc va chot ke hoach trien khai.`,
      result: `${config.batchLabel} Da goi xac nhan va hen lich cham soc tiep theo.`,
      nextContent: `${config.batchLabel} Theo doi phan hoi sau lan cham soc dau tien.`,
    },
  };
}

async function createCustomer(page, state, config, data) {
  return runStep(state, page, 'service', 'Tạo khách hàng dịch vụ', async () => {
    await gotoPath(page, `${config.baseURL}/customers`);
    await waitForTableText(page, 'Thêm khách hàng', config.actionTimeoutMs);

    await page.getByRole('button', { name: 'Thêm khách hàng' }).click();
    await page.locator('input[placeholder="KH001, COMP-XYZ..."]').fill(data.code);
    await page.locator('input[placeholder="Tên công ty hoặc cá nhân"]').fill(data.name);
    await controlByLabel(page, 'Loại khách hàng *', 'select').selectOption('both');
    await page.locator('input[placeholder="SĐT liên hệ"]').fill(data.phone);
    await page.locator('input[placeholder="Địa chỉ Email"]').fill(data.email);
    await page.locator('input[placeholder="Địa chỉ văn phòng khách hàng"]').fill(data.address);
    await page.locator('textarea[placeholder="Nhu cầu khách hàng, thói quen liên lạc..."]').fill(data.notes);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Lưu thông tin' }).click(),
      buildPathResponseMatcher('/api/customers', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'customers', {
      id: response.data.id,
      code: response.data.code,
      name: response.data.name,
      customerType: response.data.customerType,
    });

    return response.data;
  }, { continueOnError: true });
}

async function createOpportunity(page, state, config, customer, data) {
  if (!customer) {
    recordWarning(state, 'Bỏ qua tạo cơ hội vì khách hàng dịch vụ chưa được tạo.');
    return null;
  }

  return runStep(state, page, 'service', 'Tạo cơ hội bán hàng', async () => {
    await gotoPath(page, `${config.baseURL}/opportunities`);
    await waitForTableText(page, 'Tạo cơ hội mới', config.actionTimeoutMs);

    await page.getByRole('button', { name: 'Tạo cơ hội mới' }).click();
    await page.locator('input[placeholder="OPP-001..."]').fill(data.code);
    await controlByLabel(page, 'Chọn Khách hàng *', 'select').selectOption({ label: `${customer.name} (${customer.code})` });
    await page.locator('input[placeholder="Gói thầu thiết kế phần mềm, cung ứng máy móc..."]').fill(data.title);
    await page.locator('input[placeholder="Mức ngân sách ước lượng"]').fill(data.expectedValue);
    await page.locator('textarea[placeholder="Khách hàng cần cung cấp giải pháp gì, thời gian giao hàng như thế nào..."]').fill(data.needDescription);
    await page.locator('input[placeholder="Thông tin đối thủ, tiến độ đàm phán..."]').fill(data.notes);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Lưu cơ hội' }).click(),
      buildPathResponseMatcher('/api/opportunities', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'opportunities', {
      id: response.data.id,
      code: response.data.code,
      title: response.data.title,
    });

    return response.data;
  }, { continueOnError: true });
}

async function createQuote(page, state, config, customer, opportunity, data) {
  if (!customer || !opportunity) {
    recordWarning(state, 'Bỏ qua tạo báo giá vì thiếu khách hàng hoặc cơ hội.');
    return null;
  }

  return runStep(state, page, 'service', 'Tạo báo giá dịch vụ', async () => {
    await gotoPath(page, `${config.baseURL}/quotes`);
    await waitForTableText(page, 'Tạo báo giá', config.actionTimeoutMs);

    await page.getByRole('button', { name: 'Tạo báo giá' }).click();
    await page.locator('input[placeholder="Q-001, BGDV-01..."]').fill(data.code);
    await page.locator('input[placeholder="QUO-2026-0001..."]').fill(data.quoteNumber);
    await controlByLabel(page, 'Chọn Khách hàng *', 'select').selectOption({ label: `${customer.name} (${customer.code})` });
    await controlByLabel(page, 'Chọn Cơ hội liên quan', 'select').selectOption({ label: `${opportunity.title} (${opportunity.code})` });
    await page.locator('textarea[placeholder="Thanh toán 50% sau khi ký hợp đồng, 50% sau khi nghiệm thu bàn giao..."]').fill(data.termsNote);

    await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Lưu báo giá' }).click(),
      buildPathResponseMatcher('/api/quotes', 'POST'),
      config.responseTimeoutMs
    );

    const listResponsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/quotes', 'GET'),
      { timeout: config.responseTimeoutMs }
    );
    await page.locator('input[placeholder="Tìm theo số báo giá, mã, khách..."]').fill(data.quoteNumber);
    const listResponse = await listResponsePromise;
    const listJson = await listResponse.json();
    const createdQuote = (listJson.data || []).find((item) => item.quoteNumber === data.quoteNumber || item.code === data.code);
    if (!createdQuote) {
      throw new Error(`Đã submit báo giá nhưng không tìm lại được bản ghi ${data.quoteNumber} trong danh sách.`);
    }

    addEntity(state, 'quotes', {
      id: createdQuote.id,
      code: createdQuote.code,
      quoteNumber: createdQuote.quoteNumber,
      totalAmount: createdQuote.totalAmount,
    });

    return createdQuote;
  }, { continueOnError: true });
}

async function approveAndConvertQuote(page, state, config, quote) {
  if (!quote) {
    recordWarning(state, 'Bỏ qua phê duyệt/chuyển đổi báo giá vì báo giá chưa được tạo.');
    return null;
  }

  await runStep(state, page, 'service', 'Phê duyệt báo giá', async () => {
    await gotoPath(page, `${config.baseURL}/quotes/${quote.id}`);
    await waitForTableText(page, 'Phê duyệt báo giá', config.actionTimeoutMs);

    await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Phê duyệt báo giá' }).click(),
      buildContainsResponseMatcher(`/api/quotes/${quote.id}`, 'PATCH'),
      config.responseTimeoutMs
    );
  }, { continueOnError: true });

  return runStep(state, page, 'service', 'Chuyển báo giá thành hợp đồng', async () => {
    await gotoPath(page, `${config.baseURL}/quotes/${quote.id}`);
    await waitForTableText(page, 'Ký hợp đồng dịch vụ', config.actionTimeoutMs);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Ký hợp đồng dịch vụ' }).click(),
      buildContainsResponseMatcher(`/api/quotes/${quote.id}/convert`, 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'contracts', {
      id: response.data.contractId,
      contractNumber: response.data.contractNumber,
      sourceQuote: quote.quoteNumber,
    });

    return response.data;
  }, { continueOnError: true });
}

async function signContract(page, state, config, contract) {
  if (!contract) {
    recordWarning(state, 'Bỏ qua ký hợp đồng vì chưa có hợp đồng từ báo giá.');
    return null;
  }

  return runStep(state, page, 'service', 'Ký hợp đồng và khởi tạo dự án', async () => {
    await gotoPath(page, `${config.baseURL}/contracts/${contract.contractId}`);
    await waitForTableText(page, 'Ký kết & Khởi tạo dự án', config.actionTimeoutMs);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Ký kết & Khởi tạo dự án' }).click(),
      buildContainsResponseMatcher(`/api/contracts/${contract.contractId}`, 'PATCH'),
      config.responseTimeoutMs
    );

    return response.data;
  }, { continueOnError: true });
}

async function verifyProject(page, state, config, contract, customer) {
  if (!contract || !customer) {
    recordWarning(state, 'Bỏ qua kiểm tra dự án vì thiếu hợp đồng hoặc khách hàng.');
    return null;
  }

  const projectName = `Du an - ${contract.contractNumber}`;

  return runStep(state, page, 'service', 'Kiểm tra dự án tự động được tạo', async () => {
    await gotoPath(page, `${config.baseURL}/projects`);
    const responsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/projects', 'GET'),
      { timeout: config.responseTimeoutMs }
    );

    await page.locator('input[placeholder="Tìm theo tên dự án, mã, khách..."]').fill(projectName);
    const response = await responsePromise;
    const json = await response.json();

    const project = (json.data || []).find((item) => item.name === projectName || item.customerName === customer.name);
    if (!project) {
      throw new Error(`Không tìm thấy dự án tự động "${projectName}" trên danh sách dự án.`);
    }

    addEntity(state, 'projects', {
      id: project.id,
      code: project.code,
      name: project.name,
    });

    return project;
  }, { continueOnError: true });
}

async function verifyServiceReceivable(page, state, config, contract) {
  if (!contract) {
    recordWarning(state, 'Bỏ qua kiểm tra công nợ dịch vụ vì thiếu hợp đồng.');
    return null;
  }

  return runStep(state, page, 'service', 'Kiểm tra milestone và công nợ dịch vụ', async () => {
    await gotoPath(page, `${config.baseURL}/receivables`);
    const responsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/receivables', 'GET'),
      { timeout: config.responseTimeoutMs }
    );

    await page.locator('input[placeholder="Tìm theo mã nợ, khách hàng..."]').fill(contract.contractNumber);
    const response = await responsePromise;
    const json = await response.json();

    const receivable = (json.data || []).find((item) => item.contractNumber === contract.contractNumber);
    if (!receivable) {
      throw new Error(`Không tìm thấy công nợ dịch vụ cho hợp đồng ${contract.contractNumber}.`);
    }

    addEntity(state, 'receivables', {
      id: receivable.id,
      code: receivable.code,
      source: contract.contractNumber,
      status: receivable.status,
    });

    return receivable;
  }, { continueOnError: true });
}

async function createReminder(page, state, config, customer, contract, project, data) {
  if (!customer) {
    recordWarning(state, 'Bỏ qua tạo lịch chăm sóc vì thiếu khách hàng.');
    return null;
  }

  return runStep(state, page, 'service', 'Tạo lịch chăm sóc khách hàng', async () => {
    await gotoPath(page, `${config.baseURL}/customer-care`);
    await waitForTableText(page, 'Tạo lịch nhắc hẹn', config.actionTimeoutMs);

    await page.getByRole('button', { name: 'Tạo lịch nhắc hẹn' }).click();
    await controlByLabel(page, 'Khách hàng *', 'select').selectOption({ label: `${customer.name} (${customer.code})` });

    if (contract) {
      await controlByLabel(page, 'Hợp đồng liên quan', 'select').selectOption({ label: contract.contractNumber });
    }

    if (project) {
      await controlByLabel(page, 'Dự án liên quan', 'select').selectOption({ label: project.name });
    }

    await controlByLabel(page, 'Ngày nhắc hẹn *', 'input').fill(config.today);
    await page.locator('textarea[placeholder="Ghi nhận nội dung cần tư vấn, trao đổi hoặc hỏi thăm khách hàng định kỳ..."]').fill(data.content);

    await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Tạo nhắc hẹn' }).click(),
      buildPathResponseMatcher('/api/customer-care', 'POST'),
      config.responseTimeoutMs
    );

    const listResponsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/customer-care', 'GET'),
      { timeout: config.responseTimeoutMs }
    );
    await page.locator('input[placeholder="Tìm theo khách hàng, nội dung..."]').fill(customer.name);
    const listResponse = await listResponsePromise;
    const listJson = await listResponse.json();
    const createdReminder = (listJson.data || []).find((item) => item.content === data.content && item.customerId === customer.id);
    if (!createdReminder) {
      throw new Error(`Đã tạo lịch chăm sóc nhưng không tìm lại được lịch cho khách hàng ${customer.name}.`);
    }

    addEntity(state, 'customerCareReminders', {
      id: createdReminder.id,
      customer: createdReminder.customerName,
      reminderDate: createdReminder.reminderDate,
      status: createdReminder.status,
    });

    return createdReminder;
  }, { continueOnError: true });
}

async function triggerReminderSystem(page, state, config) {
  return runStep(state, page, 'service', 'Chạy cập nhật trạng thái nhắc hẹn và công nợ', async () => {
    await gotoPath(page, `${config.baseURL}/receivables`);
    await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Cập nhật nợ' }).click(),
      buildContainsResponseMatcher('/api/receivables/trigger-reminders', 'POST'),
      config.responseTimeoutMs
    );
  }, { continueOnError: true });
}

async function completeReminder(page, state, config, reminder, data) {
  if (!reminder) {
    recordWarning(state, 'Bỏ qua hoàn thành lịch chăm sóc vì chưa tạo được lịch.');
    return null;
  }

  const nextDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return runStep(state, page, 'service', 'Hoàn thành lịch chăm sóc và tạo lịch kế tiếp', async () => {
    await gotoPath(page, `${config.baseURL}/customer-care`);
    await fillSearch(
      page,
      'Tìm theo khách hàng, nội dung...',
      reminder.customerName,
      buildPathResponseMatcher('/api/customer-care', 'GET'),
      config.responseTimeoutMs
    );

    await page.getByRole('button', { name: 'Chăm sóc' }).first().click();
    await controlByLabel(page, 'Ngày chăm sóc tiếp theo', 'input').fill(nextDate);
    await page.locator('textarea[placeholder="Ghi lại kết quả cuộc gọi, email trao đổi hoặc ý kiến phản hồi từ khách hàng..."]').fill(data.result);
    await page.locator('textarea[placeholder="Nhập nội dung cần theo dõi, nhắc nhở cho lần chăm sóc sau..."]').fill(data.nextContent);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Lưu kết quả' }).click(),
      buildContainsResponseMatcher(`/api/customer-care/${reminder.id}/complete`, 'POST'),
      config.responseTimeoutMs
    );

    recordNote(
      state,
      `Lịch chăm sóc ${reminder.id} đã hoàn tất. Kỳ chăm sóc tiếp theo được đặt vào ${nextDate}.`
    );

    return response.data;
  }, { continueOnError: true });
}

async function runServiceFlow(page, state, config) {
  const data = createServiceData(config);

  const customer = await createCustomer(page, state, config, data.customer);
  const opportunity = await createOpportunity(page, state, config, customer, data.opportunity);
  const quote = await createQuote(page, state, config, customer, opportunity, data.quote);
  const contract = await approveAndConvertQuote(page, state, config, quote);
  await signContract(page, state, config, contract);
  const project = await verifyProject(page, state, config, contract, customer);
  const receivable = await verifyServiceReceivable(page, state, config, contract);
  const reminder = await createReminder(page, state, config, customer, contract, project, data.reminder);
  await triggerReminderSystem(page, state, config);
  await completeReminder(page, state, config, reminder, data.reminder);

  if (!receivable) {
    recordWarning(state, 'Luồng dịch vụ không tìm thấy công nợ sau khi ký hợp đồng. Cần kiểm tra lại dữ liệu phát sinh hoặc UI lọc.');
  }
}

module.exports = {
  runServiceFlow,
};
