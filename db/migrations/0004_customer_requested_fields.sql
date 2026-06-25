alter table app.customers
add column if not exists industry_id uuid references app.catalog_items(id) on delete set null,
add column if not exists customer_source_id uuid references app.catalog_items(id) on delete set null;

alter table app.customer_contacts
add column if not exists department text,
add column if not exists contact_role_id uuid references app.catalog_items(id) on delete set null;

alter table app.opportunities
add column if not exists contact_id uuid references app.customer_contacts(id) on delete set null,
add column if not exists service_id uuid references app.catalog_items(id) on delete set null;

alter table app.quotes
add column if not exists expiry_date date,
add column if not exists vat_rate numeric(5,2) not null default 10,
add column if not exists implementation_time text;

alter table app.contracts
add column if not exists contract_name text,
add column if not exists start_date date,
add column if not exists expected_end_date date,
add column if not exists payment_terms text;

alter table app.contracts
add column if not exists created_project_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'contracts_created_project_id_fkey'
      and conrelid = 'app.contracts'::regclass
  ) then
    alter table app.contracts
    add constraint contracts_created_project_id_fkey
    foreign key (created_project_id) references app.projects(id) on delete set null;
  end if;
end $$;

alter table app.payment_milestones
add column if not exists payment_rate numeric(7,4);

alter table app.receivables
add column if not exists invoice_number text,
add column if not exists invoice_date date;

alter table app.customer_care_reminders
add column if not exists contact_id uuid references app.customer_contacts(id) on delete set null,
add column if not exists care_type_id uuid references app.catalog_items(id) on delete set null;

alter table app.projects
add column if not exists project_scope text,
add column if not exists folder_url text;

create table if not exists app.project_team_members (
  project_id uuid not null references app.projects(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table app.schedules
add column if not exists location text,
add column if not exists internal_attendee_ids uuid[] not null default '{}'::uuid[];

alter table app.schedules
drop constraint if exists schedules_status_check;

alter table app.schedules
add constraint schedules_status_check check (
  status in ('planned', 'confirmed', 'done', 'postponed', 'cancelled')
);

alter table app.project_tasks
add column if not exists progress_percent integer not null default 0,
add column if not exists result text;

alter table app.project_tasks
drop constraint if exists project_tasks_progress_check;

alter table app.project_tasks
add constraint project_tasks_progress_check check (progress_percent between 0 and 100);

create table if not exists app.project_task_collaborators (
  task_id uuid not null references app.project_tasks(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

alter table app.internal_notes
add column if not exists note_title text,
add column if not exists recipient_user_ids uuid[] not null default '{}'::uuid[],
add column if not exists requires_response boolean not null default false,
add column if not exists response_due_date date;

alter table app.project_closures
add column if not exists completion_summary text,
add column if not exists acceptance_file_asset_id uuid references app.file_assets(id) on delete set null,
add column if not exists receivable_completed boolean not null default false,
add column if not exists closed_by uuid references app.users(id) on delete set null;

alter table app.suppliers
add column if not exists tax_code text,
add column if not exists payment_terms text,
add column if not exists credit_limit numeric(18,2) not null default 0;

alter table app.suppliers
drop constraint if exists suppliers_credit_limit_check;

alter table app.suppliers
add constraint suppliers_credit_limit_check check (credit_limit >= 0);

alter table app.products
add column if not exists product_group_id uuid references app.catalog_items(id) on delete set null,
add column if not exists specification text,
add column if not exists standard_cost numeric(18,2) not null default 0,
add column if not exists selling_price numeric(18,2) not null default 0,
add column if not exists default_supplier_id uuid references app.suppliers(id) on delete set null;

alter table app.products
drop constraint if exists products_cost_price_check;

alter table app.products
add constraint products_cost_price_check check (
  standard_cost >= 0 and selling_price >= 0
);

alter table app.warehouses
add column if not exists warehouse_manager_id uuid references app.users(id) on delete set null;

alter table app.purchase_orders
add column if not exists expected_delivery_date date,
add column if not exists warehouse_id uuid references app.warehouses(id) on delete set null,
add column if not exists paid_amount numeric(18,2) not null default 0,
add column if not exists payment_due_date date,
add column if not exists buyer_user_id uuid references app.users(id) on delete set null;

alter table app.purchase_orders
drop constraint if exists purchase_orders_payment_check;

alter table app.purchase_orders
add constraint purchase_orders_payment_check check (
  paid_amount >= 0 and paid_amount <= total_amount
);

alter table app.purchase_order_items
add column if not exists quantity_received numeric(18,3) not null default 0;

alter table app.purchase_order_items
drop constraint if exists purchase_order_items_received_check;

alter table app.purchase_order_items
add constraint purchase_order_items_received_check check (
  quantity_received >= 0 and quantity_received <= quantity
);

alter table app.stock_receipts
add column if not exists supplier_id uuid references app.suppliers(id) on delete set null,
add column if not exists total_quantity numeric(18,3) not null default 0,
add column if not exists quality_status_id uuid references app.catalog_items(id) on delete set null;

alter table app.stock_receipts
drop constraint if exists stock_receipts_quantity_check;

alter table app.stock_receipts
add constraint stock_receipts_quantity_check check (total_quantity >= 0);

alter table app.stock_receipt_items
add column if not exists rejected_quantity numeric(18,3) not null default 0,
add column if not exists batch_number text,
add column if not exists storage_location text;

alter table app.stock_receipt_items
drop constraint if exists stock_receipt_items_rejected_check;

alter table app.stock_receipt_items
add constraint stock_receipt_items_rejected_check check (
  rejected_quantity >= 0 and rejected_quantity <= quantity
);

alter table app.sales_orders
add column if not exists contact_id uuid references app.customer_contacts(id) on delete set null,
add column if not exists expected_delivery_date date,
add column if not exists warehouse_id uuid references app.warehouses(id) on delete set null,
add column if not exists payment_due_date date;

alter table app.sales_order_items
add column if not exists quantity_delivered numeric(18,3) not null default 0,
add column if not exists estimated_cost numeric(18,2) not null default 0;

alter table app.sales_order_items
drop constraint if exists sales_order_items_delivery_cost_check;

alter table app.sales_order_items
add constraint sales_order_items_delivery_cost_check check (
  quantity_delivered >= 0 and quantity_delivered <= quantity and estimated_cost >= 0
);

alter table app.inventory_balances
add column if not exists reserved_quantity numeric(18,3) not null default 0,
add column if not exists average_cost numeric(18,2) not null default 0;

alter table app.inventory_balances
drop constraint if exists inventory_balances_reserved_cost_check;

alter table app.inventory_balances
add constraint inventory_balances_reserved_cost_check check (
  reserved_quantity >= 0 and reserved_quantity <= quantity_on_hand and average_cost >= 0
);

create table if not exists app.stock_issues (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  sales_order_id uuid references app.sales_orders(id) on delete set null,
  customer_id uuid not null references app.customers(id) on delete restrict,
  warehouse_id uuid not null references app.warehouses(id) on delete restrict,
  issue_date date not null default current_date,
  issued_by uuid references app.users(id) on delete set null,
  total_quantity numeric(18,3) not null default 0,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint stock_issues_quantity_check check (total_quantity >= 0),
  constraint stock_issues_status_check check (status in ('draft', 'confirmed', 'delivered', 'cancelled'))
);

create table if not exists app.stock_issue_items (
  id uuid primary key default gen_random_uuid(),
  stock_issue_id uuid not null references app.stock_issues(id) on delete cascade,
  sales_order_item_id uuid references app.sales_order_items(id) on delete set null,
  product_id uuid not null references app.products(id) on delete restrict,
  quantity numeric(18,3) not null,
  unit_cost numeric(18,2) not null default 0,
  batch_number text,
  storage_location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_issue_items_amount_check check (quantity > 0 and unit_cost >= 0)
);

drop trigger if exists stock_issues_set_updated_at on app.stock_issues;
create trigger stock_issues_set_updated_at
before update on app.stock_issues
for each row execute function app.set_updated_at();

drop trigger if exists stock_issue_items_set_updated_at on app.stock_issue_items;
create trigger stock_issue_items_set_updated_at
before update on app.stock_issue_items
for each row execute function app.set_updated_at();

alter table app.file_assets
drop constraint if exists file_assets_content_type_check;

alter table app.file_assets
add constraint file_assets_content_type_check check (
  content_type like 'image/%'
  or content_type in (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv'
  )
);

alter table app.users
add column if not exists employee_code text,
add column if not exists position text;

insert into app.catalog_categories (code, name, description, is_system)
values
  ('industry', 'Nganh nghe', 'Nganh nghe hoat dong cua khach hang.', true),
  ('customer_source', 'Nguon khach hang', 'Nguon phat sinh khach hang.', true),
  ('service', 'Dich vu tu van', 'Dich vu hoac goi tu van.', true),
  ('contact_role', 'Vai tro lien he', 'Vai tro cua nguoi lien he tai khach hang.', true),
  ('care_type', 'Hinh thuc cham soc', 'Kenh hoac hinh thuc cham soc khach hang.', true),
  ('product_group', 'Nhom hang', 'Phan nhom san pham hang hoa.', true),
  ('quality_status', 'Tinh trang chat luong', 'Tinh trang kiem tra chat luong nhap kho.', true)
on conflict (code) do nothing;

insert into app.catalog_items (category_id, code, name, sort_order, is_system)
select category.id, item.code, item.name, item.sort_order, true
from app.catalog_categories category
join (
  values
    ('industry', 'consulting', 'Tu van dich vu', 10),
    ('industry', 'commerce', 'Thuong mai', 20),
    ('industry', 'manufacturing', 'San xuat', 30),
    ('customer_source', 'referral', 'Gioi thieu', 10),
    ('customer_source', 'website', 'Website', 20),
    ('customer_source', 'direct', 'Lien he truc tiep', 30),
    ('service', 'iso_consulting', 'Tu van ISO', 10),
    ('service', 'training', 'Dao tao', 20),
    ('service', 'audit_support', 'Ho tro danh gia', 30),
    ('contact_role', 'decision_maker', 'Nguoi quyet dinh', 10),
    ('contact_role', 'coordinator', 'Nguoi phoi hop', 20),
    ('contact_role', 'accounting', 'Ke toan', 30),
    ('care_type', 'phone', 'Goi dien', 10),
    ('care_type', 'zalo', 'Zalo', 20),
    ('care_type', 'email', 'Email', 30),
    ('care_type', 'meeting', 'Gap truc tiep', 40),
    ('product_group', 'general', 'Hang hoa chung', 10),
    ('product_group', 'materials', 'Vat tu', 20),
    ('quality_status', 'passed', 'Dat', 10),
    ('quality_status', 'failed', 'Khong dat', 20),
    ('quality_status', 'pending', 'Cho kiem tra', 30)
) as item(category_code, code, name, sort_order)
  on category.code = item.category_code
on conflict (category_id, code) do nothing;

insert into app.permissions (code, module, action, scope, description)
values
  ('catalog.view.all', 'catalog', 'view', 'all', 'Xem danh muc dung chung.'),
  ('catalog.configure.all', 'catalog', 'configure', 'all', 'Quan ly danh muc dung chung.'),
  ('stock_issues.view.all', 'stock_issues', 'view', 'all', 'Xem phieu xuat kho.'),
  ('stock_issues.create.all', 'stock_issues', 'create', 'all', 'Tao phieu xuat kho.'),
  ('stock_issues.confirm.all', 'stock_issues', 'confirm', 'all', 'Xac nhan phieu xuat kho.')
on conflict (code) do nothing;

create index if not exists customers_industry_idx on app.customers (industry_id) where deleted_at is null;
create index if not exists customers_source_idx on app.customers (customer_source_id) where deleted_at is null;
create index if not exists customer_contacts_role_idx on app.customer_contacts (contact_role_id) where deleted_at is null;
create index if not exists opportunities_contact_idx on app.opportunities (contact_id) where deleted_at is null;
create index if not exists opportunities_service_idx on app.opportunities (service_id) where deleted_at is null;
create index if not exists customer_care_contact_idx on app.customer_care_reminders (contact_id) where deleted_at is null;
create index if not exists customer_care_type_idx on app.customer_care_reminders (care_type_id) where deleted_at is null;
create index if not exists project_team_members_user_idx on app.project_team_members (user_id);
create index if not exists project_task_collaborators_user_idx on app.project_task_collaborators (user_id);
create index if not exists products_group_idx on app.products (product_group_id) where deleted_at is null;
create index if not exists products_default_supplier_idx on app.products (default_supplier_id) where deleted_at is null;
create index if not exists warehouses_manager_idx on app.warehouses (warehouse_manager_id) where deleted_at is null;
create index if not exists purchase_orders_warehouse_idx on app.purchase_orders (warehouse_id) where deleted_at is null;
create index if not exists purchase_orders_buyer_idx on app.purchase_orders (buyer_user_id) where deleted_at is null;
create index if not exists stock_receipts_supplier_idx on app.stock_receipts (supplier_id) where deleted_at is null;
create index if not exists sales_orders_contact_idx on app.sales_orders (contact_id) where deleted_at is null;
create index if not exists sales_orders_warehouse_idx on app.sales_orders (warehouse_id) where deleted_at is null;
create index if not exists stock_issues_sales_order_idx on app.stock_issues (sales_order_id) where sales_order_id is not null and deleted_at is null;
create index if not exists stock_issues_customer_status_idx on app.stock_issues (customer_id, status, issue_date) where deleted_at is null;
create index if not exists stock_issues_warehouse_date_idx on app.stock_issues (warehouse_id, issue_date) where deleted_at is null;
create index if not exists stock_issue_items_issue_idx on app.stock_issue_items (stock_issue_id);
create index if not exists stock_issue_items_product_idx on app.stock_issue_items (product_id);
create index if not exists users_employee_code_idx on app.users (employee_code) where employee_code is not null and deleted_at is null;
