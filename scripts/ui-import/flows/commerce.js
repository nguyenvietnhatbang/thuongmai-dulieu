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
  selectOptionContainingText,
  waitForTableText,
} = require('../lib/playwright-utils');

function createCommerceData(config) {
  const phoneSuffix = config.batchId.replace(/\D/g, '').slice(-8).padStart(8, '0');

  return {
    customer: {
      code: `${config.batchId}-CUS-COM`,
      name: `${config.batchLabel} Siêu thị Minh Châu`,
      phone: `08${phoneSuffix}`,
      email: `${config.batchId.toLowerCase()}-thuongmai@example.com`,
      address: '58 Võ Văn Ngân, Phường Thủ Đức, TP. Hồ Chí Minh',
      notes: 'Khách hàng thương mại mẫu chuyên nhập hàng định kỳ cho chuỗi bán lẻ nội địa.',
    },
    product: {
      code: `${config.batchId}-SKU-01`,
      name: `${config.batchLabel} Máy in hóa đơn nhiệt`,
      minStockQuantity: '5',
    },
    supplier: {
      code: `${config.batchId}-SUP`,
      name: `${config.batchLabel} Công ty TNHH Thiết bị Sao Việt`,
      phone: '0280000000',
      email: `${config.batchId.toLowerCase()}-nhacungcap@example.com`,
      address: 'Lô B2 Khu công nghiệp Tân Bình, TP. Hồ Chí Minh',
    },
    warehouse: {
      code: `${config.batchId}-WH`,
      name: `${config.batchLabel} Kho trung tâm miền Nam`,
      address: '12 Đường số 7, Khu công nghiệp Sóng Thần, Bình Dương',
    },
    purchaseOrder: {
      code: `${config.batchId}-PO`,
      notes: 'Đơn mua hàng mẫu nhập lô thiết bị bán lẻ phục vụ kiểm thử quy trình mua - nhập kho.',
      quantity: '10',
      unitPrice: '250000',
    },
    receipt: {
      code: `${config.batchId}-GRN`,
      notes: 'Phiếu nhập kho xác nhận hàng đã về đủ theo đơn mua hàng mẫu.',
    },
    salesOrder: {
      code: `${config.batchId}-SO`,
      notes: 'Đơn bán hàng mẫu cho khách sỉ, dùng để kiểm thử xuất kho và phát sinh công nợ.',
      quantity: '3',
      unitPrice: '400000',
      paidAmount: '0',
    },
  };
}

async function pollReceivables(page, config, searchValue, matcher) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const responsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/receivables', 'GET'),
      { timeout: config.responseTimeoutMs }
    );

    await page.locator('input[placeholder="Tìm theo mã nợ, khách hàng..."]').fill(searchValue);
    const response = await responsePromise;
    const json = await response.json();
    const match = (json.data || []).find(matcher);
    if (match) {
      return match;
    }

    await page.waitForTimeout(800);
  }

  return null;
}

async function createCommerceCustomer(page, state, config, data) {
  return runStep(state, page, 'commerce', 'Tạo khách hàng thương mại', async () => {
    await gotoPath(page, `${config.baseURL}/customers`);
    await waitForTableText(page, 'Thêm khách hàng', config.actionTimeoutMs);

    await page.getByRole('button', { name: 'Thêm khách hàng' }).click();
    await page.locator('input[placeholder="KH001, COMP-XYZ..."]').fill(data.code);
    await page.locator('input[placeholder="Tên công ty hoặc cá nhân"]').fill(data.name);
    await controlByLabel(page, 'Loại khách hàng *', 'select').selectOption('commerce');
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

async function createProduct(page, state, config, data) {
  return runStep(state, page, 'commerce', 'Tạo sản phẩm nền', async () => {
    await gotoPath(page, `${config.baseURL}/masters`);
    await waitForTableText(page, 'Sản phẩm', config.actionTimeoutMs);

    await page.getByRole('button', { name: '+ Sản phẩm' }).click();
    await page.locator('input[placeholder="SKU-PROD-01..."]').fill(data.code);
    await page.locator('input[placeholder="Tên hàng hóa..."]').fill(data.name);
    await controlByLabel(page, 'Đơn vị tính', 'select').selectOption('item');
    await controlByLabel(page, 'Tồn tối thiểu', 'input').fill(data.minStockQuantity);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: /^Lưu/ }).click(),
      buildPathResponseMatcher('/api/inventory/products', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'products', {
      id: response.data.id,
      code: response.data.code || data.code,
      name: response.data.name || data.name,
    });

    return {
      id: response.data.id,
      code: response.data.code || data.code,
      name: response.data.name || data.name,
    };
  }, { continueOnError: true });
}

async function createSupplier(page, state, config, data) {
  return runStep(state, page, 'commerce', 'Tạo nhà cung cấp nền', async () => {
    await gotoPath(page, `${config.baseURL}/masters`);
    await page.getByRole('button', { name: /^Nhà cung cấp \(/ }).click();
    await page.getByRole('button', { name: '+ Nhà cung cấp' }).click();
    await page.locator('input[placeholder="SUP-001..."]').fill(data.code);
    await page.locator('input[placeholder="Công ty cung ứng..."]').fill(data.name);
    await page.locator('input[placeholder="SĐT"]').fill(data.phone);
    await page.locator('input[placeholder="Email"]').fill(data.email);
    await page.locator('input[placeholder="Địa chỉ giao dịch"]').fill(data.address);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: /^Lưu/ }).click(),
      buildPathResponseMatcher('/api/inventory/suppliers', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'suppliers', {
      id: response.data.id,
      code: response.data.code || data.code,
      name: response.data.name || data.name,
    });

    return {
      id: response.data.id,
      code: response.data.code || data.code,
      name: response.data.name || data.name,
    };
  }, { continueOnError: true });
}

async function createWarehouse(page, state, config, data) {
  return runStep(state, page, 'commerce', 'Tạo kho nền', async () => {
    await gotoPath(page, `${config.baseURL}/masters`);
    await page.getByRole('button', { name: /^Kho hàng \(/ }).click();
    await page.getByRole('button', { name: '+ Kho hàng' }).click();
    await page.locator('input[placeholder="WH-HN, WH-SG..."]').fill(data.code);
    await page.locator('input[placeholder="Kho trung tâm..."]').fill(data.name);
    await page.locator('input[placeholder="Địa chỉ kho bãi"]').fill(data.address);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: /^Lưu/ }).click(),
      buildPathResponseMatcher('/api/inventory/warehouses', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'warehouses', {
      id: response.data.id,
      code: response.data.code || data.code,
      name: response.data.name || data.name,
    });

    return {
      id: response.data.id,
      code: response.data.code || data.code,
      name: response.data.name || data.name,
    };
  }, { continueOnError: true });
}

async function createPurchaseOrder(page, state, config, product, supplier, data) {
  if (!product || !supplier) {
    recordWarning(state, 'Bỏ qua tạo đơn mua vì thiếu sản phẩm hoặc nhà cung cấp.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Tạo đơn mua hàng', async () => {
    await gotoPath(page, `${config.baseURL}/purchases`);
    await waitForTableText(page, 'Đơn mua hàng', config.actionTimeoutMs);

    await page.getByRole('button', { name: '+ Đơn mua hàng' }).click();
    await page.locator('input[placeholder="PO-001..."]').fill(data.code);
    await controlByLabel(page, 'Nhà cung cấp *', 'select').selectOption({ label: supplier.name });
    await page.locator('input[placeholder="Ghi chú đơn hàng"]').fill(data.notes);
    await page.locator('select').filter({ hasText: '-- Sản phẩm --' }).first().selectOption({ label: `${product.name} (${product.code})` });
    await page.locator('input[placeholder="SL"]').first().fill(data.quantity);
    await page.locator('input[placeholder="Đơn giá"]').first().fill(data.unitPrice);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Tạo đơn đặt mua' }).click(),
      buildPathResponseMatcher('/api/inventory/purchases', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'purchaseOrders', {
      id: response.data.id,
      code: data.code,
      status: 'draft',
    });

    return {
      id: response.data.id,
      code: data.code,
      status: 'draft',
      supplierName: supplier.name,
    };
  }, { continueOnError: true });
}

async function confirmPurchaseOrder(page, state, config, purchaseOrder) {
  if (!purchaseOrder) {
    recordWarning(state, 'Bỏ qua xác nhận đơn mua vì chưa có đơn mua.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Xác nhận đơn mua hàng', async () => {
    await gotoPath(page, `${config.baseURL}/purchases`);
    await fillSearch(
      page,
      'Tìm mã PO, nhà cung cấp...',
      purchaseOrder.code,
      buildPathResponseMatcher('/api/inventory/purchases', 'GET'),
      config.responseTimeoutMs
    );
    await page.getByRole('button', { name: 'Xem' }).first().click();

    await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Xác nhận đặt hàng' }).click(),
      buildContainsResponseMatcher(`/api/inventory/purchases/${purchaseOrder.id}/confirm`, 'POST'),
      config.responseTimeoutMs
    );

    return true;
  }, { continueOnError: true });
}

async function createReceipt(page, state, config, purchaseOrder, warehouse, data) {
  if (!purchaseOrder || !warehouse) {
    recordWarning(state, 'Bỏ qua lập phiếu nhập vì thiếu đơn mua hoặc kho.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Lập phiếu nhập kho', async () => {
    await gotoPath(page, `${config.baseURL}/purchases`);
    await page.getByRole('button', { name: /^Phiếu nhập kho \(/ }).click();
    await page.getByRole('button', { name: '+ Phiếu nhập kho' }).click();
    await page.locator('input[placeholder="PNK-001..."]').fill(data.code);
    await controlByLabel(page, 'Kho nhập hàng *', 'select').selectOption({ label: warehouse.name });
    await selectOptionContainingText(
      controlByLabel(page, 'Theo đơn đặt mua (PO)', 'select'),
      purchaseOrder.code
    );
    await page.locator('input[placeholder="Diễn giải nhập hàng"]').fill(data.notes);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Lập phiếu nhập' }).click(),
      buildPathResponseMatcher('/api/inventory/receipts', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'stockReceipts', {
      id: response.data.id,
      code: data.code,
      status: 'draft',
    });

    return {
      id: response.data.id,
      code: data.code,
      status: 'draft',
    };
  }, { continueOnError: true });
}

async function confirmReceipt(page, state, config, receipt) {
  if (!receipt) {
    recordWarning(state, 'Bỏ qua xác nhận nhập kho vì chưa lập phiếu nhập.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Xác nhận nhập kho', async () => {
    await gotoPath(page, `${config.baseURL}/purchases`);
    await page.getByRole('button', { name: /^Phiếu nhập kho \(/ }).click();
    await fillSearch(
      page,
      'Tìm phiếu, PO, kho...',
      receipt.code,
      buildPathResponseMatcher('/api/inventory/receipts', 'GET'),
      config.responseTimeoutMs
    );
    await page.getByRole('button', { name: 'Xem' }).first().click();

    await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Xác nhận nhập kho' }).click(),
      buildContainsResponseMatcher(`/api/inventory/receipts/${receipt.id}/confirm`, 'POST'),
      config.responseTimeoutMs
    );

    return true;
  }, { continueOnError: true });
}

async function verifyInventory(page, state, config, product, warehouse) {
  if (!product || !warehouse) {
    recordWarning(state, 'Bỏ qua kiểm tra tồn kho vì thiếu sản phẩm hoặc kho.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Kiểm tra tồn kho và movement sau nhập hàng', async () => {
    await gotoPath(page, `${config.baseURL}/inventory`);
    const balancesResponsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/inventory/balances', 'GET'),
      { timeout: config.responseTimeoutMs }
    );

    await page.locator('input[placeholder="Tìm mã, tên hàng, kho..."]').first().fill(product.code);
    const balancesResponse = await balancesResponsePromise;
    const balancesJson = await balancesResponse.json();
    const balance = (balancesJson.data || []).find((item) => item.productCode === product.code || item.productName === product.name);
    if (!balance) {
      throw new Error(`Không tìm thấy tồn kho cho sản phẩm ${product.code}.`);
    }

    addEntity(state, 'inventoryBalances', {
      productCode: balance.productCode,
      warehouseName: balance.warehouseName,
      quantityOnHand: balance.quantityOnHand,
    });

    await page.getByRole('button', { name: 'Thẻ Kho & Biến động' }).click();
    const movementResponsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/inventory/movements', 'GET'),
      { timeout: config.responseTimeoutMs }
    );
    await page.locator('input[placeholder="Tìm mã, tên hàng, kho..."]').first().fill(product.code);
    const movementResponse = await movementResponsePromise;
    const movementJson = await movementResponse.json();
    const movement = (movementJson.data || []).find((item) => item.productCode === product.code);
    if (!movement) {
      throw new Error(`Không tìm thấy movement cho sản phẩm ${product.code}.`);
    }

    addEntity(state, 'inventoryMovements', {
      id: movement.id,
      movementType: movement.movementType,
      productCode: movement.productCode,
    });

    return { balance, movement };
  }, { continueOnError: true });
}

async function createSalesOrder(page, state, config, customer, product, warehouse, data) {
  if (!customer || !product || !warehouse) {
    recordWarning(state, 'Bỏ qua tạo đơn bán vì thiếu khách hàng, sản phẩm hoặc kho.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Tạo đơn bán hàng', async () => {
    await gotoPath(page, `${config.baseURL}/inventory`);
    await page.getByRole('button', { name: 'Đơn Bán Hàng (Sales)' }).click();
    await page.getByRole('button', { name: '+ Đơn bán hàng' }).click();
    await page.locator('input[placeholder="SO-001..."]').fill(data.code);
    await controlByLabel(page, 'Khách hàng *', 'select').selectOption({ label: `${customer.name} (${customer.code})` });
    await page.locator('input[placeholder="Số tiền đã thanh toán..."]').fill(data.paidAmount);
    await page.locator('input[placeholder="Diễn giải đơn hàng"]').fill(data.notes);
    await page.locator('select').filter({ hasText: '-- Sản phẩm --' }).first().selectOption({ label: `${product.name} (${product.code})` });
    await page.locator('select').filter({ hasText: '-- Kho xuất --' }).first().selectOption({ label: warehouse.name });
    await page.locator('input[placeholder="SL"]').first().fill(data.quantity);
    await page.locator('input[placeholder="Đơn giá"]').first().fill(data.unitPrice);

    const response = await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Tạo đơn bán hàng' }).click(),
      buildPathResponseMatcher('/api/inventory/sales', 'POST'),
      config.responseTimeoutMs
    );

    addEntity(state, 'salesOrders', {
      id: response.data.id,
      code: data.code,
      status: 'draft',
      debtAmount: 'pending',
    });

    return {
      id: response.data.id,
      code: data.code,
      status: 'draft',
    };
  }, { continueOnError: true });
}

async function confirmSalesOrder(page, state, config, salesOrder) {
  if (!salesOrder) {
    recordWarning(state, 'Bỏ qua xác nhận đơn bán vì chưa tạo được đơn bán.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Xác nhận đơn bán và trừ kho', async () => {
    await gotoPath(page, `${config.baseURL}/inventory`);
    await page.getByRole('button', { name: 'Đơn Bán Hàng (Sales)' }).click();
    await fillSearch(
      page,
      'Tìm mã đơn, khách hàng...',
      salesOrder.code,
      buildPathResponseMatcher('/api/inventory/sales', 'GET'),
      config.responseTimeoutMs
    );
    await page.getByRole('button', { name: 'Xem' }).first().click();

    await clickAndCaptureJson(
      page,
      () => page.getByRole('button', { name: 'Xác nhận & Trừ kho' }).click(),
      buildContainsResponseMatcher(`/api/inventory/sales/${salesOrder.id}/confirm`, 'POST'),
      config.responseTimeoutMs
    );

    return true;
  }, { continueOnError: true });
}

async function verifyCommerceReceivable(page, state, config, salesOrder) {
  if (!salesOrder) {
    recordWarning(state, 'Bỏ qua kiểm tra công nợ thương mại vì chưa có đơn bán.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Kiểm tra công nợ thương mại sau bán hàng', async () => {
    await gotoPath(page, `${config.baseURL}/receivables`);
    const receivable = await pollReceivables(
      page,
      config,
      salesOrder.code,
      (item) => item.salesOrderCode === salesOrder.code
    );
    if (!receivable) {
      throw new Error(`Không tìm thấy công nợ thương mại phát sinh từ đơn bán ${salesOrder.code}.`);
    }

    addEntity(state, 'receivables', {
      id: receivable.id,
      code: receivable.code,
      source: salesOrder.code,
      status: receivable.status,
    });

    return receivable;
  }, { continueOnError: true });
}

async function verifyReports(page, state, config, customer) {
  if (!customer) {
    recordWarning(state, 'Bỏ qua kiểm tra báo cáo vì thiếu khách hàng thương mại.');
    return null;
  }

  return runStep(state, page, 'commerce', 'Kiểm tra báo cáo thương mại và công nợ', async () => {
    await gotoPath(page, `${config.baseURL}/reports`);
    const summaryResponsePromise = page.waitForResponse(
      buildPathResponseMatcher('/api/reports/summary', 'GET'),
      { timeout: config.responseTimeoutMs }
    );

    await selectOptionContainingText(page.locator('select').nth(0), customer.name);
    const summaryResponse = await summaryResponsePromise;
    const summaryJson = await summaryResponse.json();
    if (!summaryJson.success || !summaryJson.data) {
      throw new Error('Không tải được summary report theo khách hàng thương mại.');
    }

    const receivables = summaryJson.data.receivables || {};
    const sales = summaryJson.data.sales || {};
    if ((sales.count || 0) < 1) {
      throw new Error('Báo cáo không phản ánh đơn bán vừa tạo.');
    }

    recordNote(
      state,
      `Report summary cho khách hàng thương mại ghi nhận ${sales.count} đơn bán và công nợ còn lại ${receivables.totalRemaining || 0}.`
    );

    return summaryJson.data;
  }, { continueOnError: true });
}

async function runCommerceFlow(page, state, config) {
  const data = createCommerceData(config);

  const customer = await createCommerceCustomer(page, state, config, data.customer);
  const product = await createProduct(page, state, config, data.product);
  const supplier = await createSupplier(page, state, config, data.supplier);
  const warehouse = await createWarehouse(page, state, config, data.warehouse);
  const purchaseOrder = await createPurchaseOrder(page, state, config, product, supplier, data.purchaseOrder);
  await confirmPurchaseOrder(page, state, config, purchaseOrder);
  const receipt = await createReceipt(page, state, config, purchaseOrder, warehouse, data.receipt);
  await confirmReceipt(page, state, config, receipt);
  await verifyInventory(page, state, config, product, warehouse);
  const salesOrder = await createSalesOrder(page, state, config, customer, product, warehouse, data.salesOrder);
  await confirmSalesOrder(page, state, config, salesOrder);
  await verifyCommerceReceivable(page, state, config, salesOrder);
  await verifyReports(page, state, config, customer);
}

module.exports = {
  runCommerceFlow,
};
