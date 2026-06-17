create index if not exists audit_logs_created_at_idx
on app.audit_logs (created_at desc);

create index if not exists products_active_name_idx
on app.products (name, code)
where deleted_at is null and status = 'active';

create index if not exists suppliers_active_name_idx
on app.suppliers (name, code)
where deleted_at is null and status = 'active';

create index if not exists warehouses_active_name_idx
on app.warehouses (name, code)
where deleted_at is null and status = 'active';

create index if not exists purchase_orders_date_idx
on app.purchase_orders (purchase_date desc, code)
where deleted_at is null;

create index if not exists stock_receipts_date_idx
on app.stock_receipts (receipt_date desc, code)
where deleted_at is null;

create index if not exists sales_orders_date_idx
on app.sales_orders (sale_date desc, code)
where deleted_at is null;
