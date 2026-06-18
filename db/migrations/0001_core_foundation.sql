create extension if not exists pgcrypto;

create schema if not exists app;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists app.catalog_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.catalog_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references app.catalog_categories(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_system boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, code)
);

create table if not exists app.departments (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint departments_status_check check (status in ('active', 'inactive'))
);

create table if not exists app.users (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references app.departments(id) on delete set null,
  manager_user_id uuid references app.users(id) on delete set null,
  email text not null unique,
  password_hash text,
  full_name text not null,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint users_status_check check (status in ('active', 'locked', 'inactive'))
);

create table if not exists app.teams (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references app.departments(id) on delete set null,
  lead_user_id uuid references app.users(id) on delete set null,
  code text not null unique,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint teams_status_check check (status in ('active', 'inactive'))
);

create table if not exists app.team_members (
  team_id uuid not null references app.teams(id) on delete cascade,
  user_id uuid not null references app.users(id) on delete cascade,
  is_lead boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table if not exists app.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists app.permissions (
  code text primary key,
  module text not null,
  action text not null,
  scope text not null,
  description text,
  created_at timestamptz not null default now(),
  constraint permissions_scope_check check (scope in ('own', 'team', 'department', 'all'))
);

create table if not exists app.company_settings (
  id uuid primary key default gen_random_uuid(),
  singleton_key text not null default 'default' unique,
  company_name text not null,
  nav_name text not null,
  short_name text not null,
  nav_subtitle text,
  tax_code text,
  address text,
  hotline text,
  email text,
  website text,
  representative_name text,
  representative_title text,
  updated_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_settings_singleton_key_check check (singleton_key = 'default')
);

create table if not exists app.role_permissions (
  role_id uuid not null references app.roles(id) on delete cascade,
  permission_code text not null references app.permissions(code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_code)
);

create table if not exists app.user_roles (
  user_id uuid not null references app.users(id) on delete cascade,
  role_id uuid not null references app.roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table if not exists app.customers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  customer_type text not null default 'service',
  owner_user_id uuid references app.users(id) on delete set null,
  status text not null default 'new',
  phone text,
  email text,
  tax_code text,
  address text,
  last_care_at timestamptz,
  next_care_at timestamptz,
  notes text,
  created_by uuid references app.users(id) on delete set null,
  updated_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint customers_type_check check (customer_type in ('service', 'commerce', 'both')),
  constraint customers_status_check check (status in ('new', 'nurturing', 'active_project', 'paused', 'stopped'))
);

create table if not exists app.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references app.customers(id) on delete cascade,
  full_name text not null,
  title text,
  phone text,
  email text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists app.opportunities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid not null references app.customers(id) on delete restrict,
  title text not null,
  need_description text,
  expected_value numeric(18,2) not null default 0,
  expected_close_date date,
  owner_user_id uuid references app.users(id) on delete set null,
  stage text not null default 'new',
  notes text,
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint opportunities_expected_value_check check (expected_value >= 0),
  constraint opportunities_stage_check check (
    stage in ('new', 'consulting', 'info_sent', 'waiting_quote', 'quoted', 'paused', 'lost', 'won')
  )
);

create table if not exists app.quotes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  quote_number text not null unique,
  customer_id uuid not null references app.customers(id) on delete restrict,
  opportunity_id uuid references app.opportunities(id) on delete set null,
  quote_date date not null default current_date,
  quoted_by uuid references app.users(id) on delete set null,
  status text not null default 'draft',
  subtotal_amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) not null default 0,
  revision_number integer not null default 1,
  terms_note text,
  approved_by uuid references app.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint quotes_amount_check check (
    subtotal_amount >= 0 and tax_amount >= 0 and total_amount >= 0
  ),
  constraint quotes_revision_check check (revision_number >= 1),
  constraint quotes_status_check check (
    status in ('draft', 'sent', 'revision_requested', 'approved', 'rejected', 'converted')
  )
);

create table if not exists app.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references app.quotes(id) on delete cascade,
  item_name text not null,
  description text,
  unit_code text,
  quantity numeric(18,3) not null default 1,
  unit_price numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_items_amount_check check (
    quantity > 0 and unit_price >= 0 and line_total >= 0
  )
);

create table if not exists app.quote_revisions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references app.quotes(id) on delete cascade,
  revision_number integer not null,
  snapshot jsonb not null,
  changed_by uuid references app.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  unique (quote_id, revision_number),
  constraint quote_revisions_number_check check (revision_number >= 1)
);

create table if not exists app.contracts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  contract_number text not null unique,
  customer_id uuid not null references app.customers(id) on delete restrict,
  quote_id uuid references app.quotes(id) on delete set null,
  signed_date date,
  contract_value numeric(18,2) not null default 0,
  owner_user_id uuid references app.users(id) on delete set null,
  status text not null default 'draft',
  project_created boolean not null default false,
  notes text,
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint contracts_value_check check (contract_value >= 0),
  constraint contracts_status_check check (
    status in ('draft', 'sent', 'negotiating', 'signed', 'paused', 'cancelled', 'completed')
  )
);

create table if not exists app.payment_milestones (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references app.contracts(id) on delete cascade,
  name text not null,
  due_date date not null,
  amount_due numeric(18,2) not null,
  amount_paid numeric(18,2) not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_milestones_amount_check check (
    amount_due >= 0 and amount_paid >= 0 and amount_paid <= amount_due
  ),
  constraint payment_milestones_status_check check (
    status in ('pending', 'due_soon', 'due_today', 'overdue', 'partially_paid', 'paid', 'cancelled')
  )
);

create table if not exists app.projects (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  contract_id uuid references app.contracts(id) on delete set null,
  customer_id uuid not null references app.customers(id) on delete restrict,
  project_manager_user_id uuid references app.users(id) on delete set null,
  start_date date,
  planned_end_date date,
  status text not null default 'new',
  progress_percent integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint projects_progress_check check (progress_percent between 0 and 100),
  constraint projects_status_check check (
    status in ('new', 'waiting_deployment', 'in_progress', 'paused', 'waiting_acceptance', 'accepted', 'closed', 'cancelled')
  )
);

create table if not exists app.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references app.projects(id) on delete cascade,
  customer_id uuid not null references app.customers(id) on delete restrict,
  title text not null,
  description text,
  assignee_user_id uuid references app.users(id) on delete set null,
  start_date date,
  due_date date,
  priority text not null default 'normal',
  status text not null default 'todo',
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint project_tasks_priority_check check (priority in ('low', 'normal', 'high', 'urgent')),
  constraint project_tasks_status_check check (
    status in ('todo', 'in_progress', 'waiting_feedback', 'completed', 'overdue', 'cancelled')
  )
);

create table if not exists app.schedules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references app.projects(id) on delete cascade,
  customer_id uuid not null references app.customers(id) on delete restrict,
  schedule_type text not null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  owner_user_id uuid references app.users(id) on delete set null,
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint schedules_time_check check (ends_at is null or ends_at >= starts_at),
  constraint schedules_type_check check (
    schedule_type in ('meeting', 'survey', 'deployment', 'acceptance', 'customer_care', 'other')
  ),
  constraint schedules_status_check check (status in ('planned', 'done', 'cancelled'))
);

create table if not exists app.internal_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references app.customers(id) on delete cascade,
  project_id uuid references app.projects(id) on delete cascade,
  task_id uuid references app.project_tasks(id) on delete cascade,
  parent_note_id uuid references app.internal_notes(id) on delete cascade,
  sender_user_id uuid not null references app.users(id) on delete restrict,
  recipient_user_id uuid not null references app.users(id) on delete restrict,
  content text not null,
  status text not null default 'unread',
  read_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint internal_notes_target_check check (
    customer_id is not null or project_id is not null or task_id is not null
  ),
  constraint internal_notes_status_check check (status in ('unread', 'read', 'processed', 'archived'))
);

create table if not exists app.project_closures (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  project_id uuid not null references app.projects(id) on delete cascade,
  closed_date date not null,
  acceptance_status text not null default 'pending',
  archive_status text not null default 'not_archived',
  notes text,
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_closures_acceptance_check check (
    acceptance_status in ('pending', 'accepted', 'rejected')
  ),
  constraint project_closures_archive_check check (
    archive_status in ('not_archived', 'archived')
  )
);

create table if not exists app.customer_care_reminders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references app.customers(id) on delete cascade,
  contract_id uuid references app.contracts(id) on delete set null,
  project_id uuid references app.projects(id) on delete set null,
  reminder_date date not null,
  owner_user_id uuid references app.users(id) on delete set null,
  content text not null,
  result text,
  status text not null default 'scheduled',
  next_care_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint customer_care_status_check check (
    status in ('scheduled', 'due_today', 'completed', 'rescheduled', 'skipped')
  )
);

create table if not exists app.suppliers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint suppliers_status_check check (status in ('active', 'inactive'))
);

create table if not exists app.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  unit_code text not null,
  min_stock_quantity numeric(18,3) not null default 0,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint products_min_stock_check check (min_stock_quantity >= 0),
  constraint products_status_check check (status in ('active', 'inactive'))
);

create table if not exists app.warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  address text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint warehouses_status_check check (status in ('active', 'inactive'))
);

create table if not exists app.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  supplier_id uuid not null references app.suppliers(id) on delete restrict,
  purchase_date date not null default current_date,
  created_by uuid references app.users(id) on delete set null,
  total_amount numeric(18,2) not null default 0,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint purchase_orders_total_check check (total_amount >= 0),
  constraint purchase_orders_status_check check (
    status in ('draft', 'ordered', 'partially_received', 'received', 'cancelled')
  )
);

create table if not exists app.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references app.purchase_orders(id) on delete cascade,
  product_id uuid not null references app.products(id) on delete restrict,
  unit_code text not null,
  quantity numeric(18,3) not null,
  unit_price numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_order_items_amount_check check (
    quantity > 0 and unit_price >= 0 and line_total >= 0
  )
);

create table if not exists app.stock_receipts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  purchase_order_id uuid references app.purchase_orders(id) on delete set null,
  warehouse_id uuid not null references app.warehouses(id) on delete restrict,
  receipt_date date not null default current_date,
  received_by uuid references app.users(id) on delete set null,
  total_amount numeric(18,2) not null default 0,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint stock_receipts_total_check check (total_amount >= 0),
  constraint stock_receipts_status_check check (status in ('draft', 'confirmed', 'cancelled'))
);

create table if not exists app.stock_receipt_items (
  id uuid primary key default gen_random_uuid(),
  stock_receipt_id uuid not null references app.stock_receipts(id) on delete cascade,
  purchase_order_item_id uuid references app.purchase_order_items(id) on delete set null,
  product_id uuid not null references app.products(id) on delete restrict,
  unit_code text not null,
  quantity numeric(18,3) not null,
  unit_price numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_receipt_items_amount_check check (
    quantity > 0 and unit_price >= 0 and line_total >= 0
  )
);

create table if not exists app.sales_orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid not null references app.customers(id) on delete restrict,
  sale_date date not null default current_date,
  salesperson_user_id uuid references app.users(id) on delete set null,
  total_amount numeric(18,2) not null default 0,
  paid_amount numeric(18,2) not null default 0,
  debt_amount numeric(18,2) not null default 0,
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint sales_orders_amount_check check (
    total_amount >= 0 and paid_amount >= 0 and debt_amount >= 0 and paid_amount <= total_amount
  ),
  constraint sales_orders_status_check check (
    status in ('draft', 'confirmed', 'delivered', 'partially_paid', 'paid', 'cancelled')
  )
);

create table if not exists app.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references app.sales_orders(id) on delete cascade,
  product_id uuid not null references app.products(id) on delete restrict,
  warehouse_id uuid references app.warehouses(id) on delete set null,
  unit_code text not null,
  quantity numeric(18,3) not null,
  unit_price numeric(18,2) not null default 0,
  line_total numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_order_items_amount_check check (
    quantity > 0 and unit_price >= 0 and line_total >= 0
  )
);

create table if not exists app.inventory_balances (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references app.products(id) on delete cascade,
  warehouse_id uuid not null references app.warehouses(id) on delete cascade,
  unit_code text not null,
  quantity_on_hand numeric(18,3) not null default 0,
  min_quantity numeric(18,3) not null default 0,
  updated_at timestamptz not null default now(),
  unique (product_id, warehouse_id),
  constraint inventory_balances_quantity_check check (
    quantity_on_hand >= 0 and min_quantity >= 0
  )
);

create table if not exists app.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references app.products(id) on delete restrict,
  warehouse_id uuid not null references app.warehouses(id) on delete restrict,
  movement_type text not null,
  source_type text not null,
  source_id uuid,
  quantity_delta numeric(18,3) not null,
  unit_cost numeric(18,2) not null default 0,
  notes text,
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint inventory_movements_type_check check (
    movement_type in ('receipt', 'sale', 'adjustment', 'return')
  ),
  constraint inventory_movements_quantity_check check (quantity_delta <> 0)
);

create table if not exists app.receivables (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_id uuid not null references app.customers(id) on delete restrict,
  contract_id uuid references app.contracts(id) on delete set null,
  project_id uuid references app.projects(id) on delete set null,
  payment_milestone_id uuid references app.payment_milestones(id) on delete set null,
  sales_order_id uuid references app.sales_orders(id) on delete set null,
  due_date date not null,
  amount_due numeric(18,2) not null,
  amount_paid numeric(18,2) not null default 0,
  status text not null default 'not_due',
  collector_user_id uuid references app.users(id) on delete set null,
  last_reminded_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint receivables_amount_check check (
    amount_due >= 0 and amount_paid >= 0 and amount_paid <= amount_due
  ),
  constraint receivables_source_check check (
    contract_id is not null or sales_order_id is not null
  ),
  constraint receivables_status_check check (
    status in ('not_due', 'due_soon', 'due_today', 'overdue', 'partially_paid', 'paid', 'cancelled')
  )
);

create table if not exists app.file_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  object_path text not null,
  original_name text,
  content_type text not null,
  size_bytes bigint not null,
  entity_type text,
  entity_id uuid,
  uploaded_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint file_assets_size_positive_check check (size_bytes > 0),
  constraint file_assets_content_type_check check (content_type like 'image/%'),
  constraint file_assets_object_unique unique (bucket, object_path)
);

create table if not exists app.receivable_exports (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  sales_order_id uuid references app.sales_orders(id) on delete set null,
  exported_at timestamptz not null default now(),
  export_format text not null default 'xlsx',
  file_name text,
  status text not null default 'exported',
  created_by uuid references app.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint receivable_exports_format_check check (export_format in ('xlsx', 'pdf', 'csv')),
  constraint receivable_exports_status_check check (status in ('exported', 'cancelled'))
);

create table if not exists app.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references app.users(id) on delete cascade,
  actor_user_id uuid references app.users(id) on delete set null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  status text not null default 'unread',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint notifications_status_check check (status in ('unread', 'read', 'archived'))
);

create table if not exists app.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists catalog_items_category_code_idx
  on app.catalog_items (category_id, code);
create index if not exists catalog_items_category_active_idx
  on app.catalog_items (category_id, is_active, sort_order);
create index if not exists users_email_lower_idx on app.users (lower(email));
create index if not exists users_department_idx on app.users (department_id);
create index if not exists teams_department_idx on app.teams (department_id);
create index if not exists roles_active_idx on app.roles (is_active);
create index if not exists permissions_module_action_scope_idx
  on app.permissions (module, action, scope);

create index if not exists customers_owner_status_idx on app.customers (owner_user_id, status) where deleted_at is null;
create index if not exists customers_name_idx on app.customers using gin (to_tsvector('simple', coalesce(name, '')));
create unique index if not exists customers_email_unique_idx on app.customers (lower(email)) where email is not null and deleted_at is null;
create unique index if not exists customers_phone_unique_idx on app.customers (phone) where phone is not null and deleted_at is null;
create unique index if not exists customers_tax_code_unique_idx on app.customers (tax_code) where tax_code is not null and deleted_at is null;
create index if not exists customer_contacts_customer_idx on app.customer_contacts (customer_id) where deleted_at is null;

create index if not exists opportunities_customer_stage_idx on app.opportunities (customer_id, stage) where deleted_at is null;
create index if not exists opportunities_owner_stage_idx on app.opportunities (owner_user_id, stage) where deleted_at is null;
create index if not exists quotes_customer_status_idx on app.quotes (customer_id, status) where deleted_at is null;
create index if not exists quotes_opportunity_idx on app.quotes (opportunity_id) where opportunity_id is not null;
create index if not exists quote_items_quote_idx on app.quote_items (quote_id);
create index if not exists contracts_customer_status_idx on app.contracts (customer_id, status) where deleted_at is null;
create index if not exists contracts_quote_idx on app.contracts (quote_id) where quote_id is not null;
create index if not exists payment_milestones_contract_due_idx on app.payment_milestones (contract_id, due_date, status);

create unique index if not exists projects_contract_unique_idx on app.projects (contract_id) where contract_id is not null and deleted_at is null;
create index if not exists projects_customer_status_idx on app.projects (customer_id, status) where deleted_at is null;
create index if not exists project_tasks_assignee_status_idx on app.project_tasks (assignee_user_id, status, due_date) where deleted_at is null;
create index if not exists project_tasks_project_status_idx on app.project_tasks (project_id, status) where deleted_at is null;
create index if not exists schedules_owner_starts_idx on app.schedules (owner_user_id, starts_at) where deleted_at is null;
create index if not exists schedules_project_starts_idx on app.schedules (project_id, starts_at) where deleted_at is null;
create index if not exists internal_notes_recipient_status_idx on app.internal_notes (recipient_user_id, status, created_at desc) where deleted_at is null;
create index if not exists internal_notes_project_idx on app.internal_notes (project_id, created_at desc) where project_id is not null and deleted_at is null;
create index if not exists project_closures_project_idx on app.project_closures (project_id);

create index if not exists customer_care_owner_reminder_idx on app.customer_care_reminders (owner_user_id, reminder_date, status) where deleted_at is null;
create index if not exists customer_care_customer_idx on app.customer_care_reminders (customer_id, reminder_date) where deleted_at is null;
create index if not exists receivables_due_status_idx on app.receivables (due_date, status) where deleted_at is null;
create index if not exists receivables_customer_status_idx on app.receivables (customer_id, status) where deleted_at is null;
create index if not exists receivables_contract_idx on app.receivables (contract_id) where contract_id is not null;
create index if not exists receivables_sales_order_idx on app.receivables (sales_order_id) where sales_order_id is not null;

create index if not exists suppliers_status_idx on app.suppliers (status) where deleted_at is null;
create index if not exists products_status_idx on app.products (status) where deleted_at is null;
create index if not exists warehouses_status_idx on app.warehouses (status) where deleted_at is null;
create index if not exists purchase_orders_supplier_status_idx on app.purchase_orders (supplier_id, status, purchase_date) where deleted_at is null;
create index if not exists purchase_order_items_order_idx on app.purchase_order_items (purchase_order_id);
create index if not exists stock_receipts_warehouse_date_idx on app.stock_receipts (warehouse_id, receipt_date) where deleted_at is null;
create index if not exists stock_receipt_items_receipt_idx on app.stock_receipt_items (stock_receipt_id);
create index if not exists sales_orders_customer_status_idx on app.sales_orders (customer_id, status, sale_date) where deleted_at is null;
create index if not exists sales_order_items_order_idx on app.sales_order_items (sales_order_id);
create index if not exists inventory_balances_warehouse_idx on app.inventory_balances (warehouse_id, product_id);
create index if not exists inventory_movements_product_warehouse_created_idx
  on app.inventory_movements (product_id, warehouse_id, created_at desc);

create index if not exists file_assets_entity_idx
  on app.file_assets (entity_type, entity_id)
  where deleted_at is null;
create index if not exists notifications_recipient_status_idx
  on app.notifications (recipient_user_id, status, created_at desc);
create index if not exists audit_logs_entity_created_at_idx
  on app.audit_logs (entity_type, entity_id, created_at desc);
create index if not exists audit_logs_actor_created_at_idx
  on app.audit_logs (actor_user_id, created_at desc);

drop trigger if exists catalog_categories_set_updated_at on app.catalog_categories;
create trigger catalog_categories_set_updated_at
before update on app.catalog_categories
for each row execute function app.set_updated_at();

drop trigger if exists catalog_items_set_updated_at on app.catalog_items;
create trigger catalog_items_set_updated_at
before update on app.catalog_items
for each row execute function app.set_updated_at();

drop trigger if exists departments_set_updated_at on app.departments;
create trigger departments_set_updated_at
before update on app.departments
for each row execute function app.set_updated_at();

drop trigger if exists users_set_updated_at on app.users;
create trigger users_set_updated_at
before update on app.users
for each row execute function app.set_updated_at();

drop trigger if exists teams_set_updated_at on app.teams;
create trigger teams_set_updated_at
before update on app.teams
for each row execute function app.set_updated_at();

drop trigger if exists roles_set_updated_at on app.roles;
create trigger roles_set_updated_at
before update on app.roles
for each row execute function app.set_updated_at();

drop trigger if exists company_settings_set_updated_at on app.company_settings;
create trigger company_settings_set_updated_at
before update on app.company_settings
for each row execute function app.set_updated_at();

drop trigger if exists customers_set_updated_at on app.customers;
create trigger customers_set_updated_at
before update on app.customers
for each row execute function app.set_updated_at();

drop trigger if exists customer_contacts_set_updated_at on app.customer_contacts;
create trigger customer_contacts_set_updated_at
before update on app.customer_contacts
for each row execute function app.set_updated_at();

drop trigger if exists opportunities_set_updated_at on app.opportunities;
create trigger opportunities_set_updated_at
before update on app.opportunities
for each row execute function app.set_updated_at();

drop trigger if exists quotes_set_updated_at on app.quotes;
create trigger quotes_set_updated_at
before update on app.quotes
for each row execute function app.set_updated_at();

drop trigger if exists quote_items_set_updated_at on app.quote_items;
create trigger quote_items_set_updated_at
before update on app.quote_items
for each row execute function app.set_updated_at();

drop trigger if exists contracts_set_updated_at on app.contracts;
create trigger contracts_set_updated_at
before update on app.contracts
for each row execute function app.set_updated_at();

drop trigger if exists payment_milestones_set_updated_at on app.payment_milestones;
create trigger payment_milestones_set_updated_at
before update on app.payment_milestones
for each row execute function app.set_updated_at();

drop trigger if exists projects_set_updated_at on app.projects;
create trigger projects_set_updated_at
before update on app.projects
for each row execute function app.set_updated_at();

drop trigger if exists project_tasks_set_updated_at on app.project_tasks;
create trigger project_tasks_set_updated_at
before update on app.project_tasks
for each row execute function app.set_updated_at();

drop trigger if exists schedules_set_updated_at on app.schedules;
create trigger schedules_set_updated_at
before update on app.schedules
for each row execute function app.set_updated_at();

drop trigger if exists internal_notes_set_updated_at on app.internal_notes;
create trigger internal_notes_set_updated_at
before update on app.internal_notes
for each row execute function app.set_updated_at();

drop trigger if exists project_closures_set_updated_at on app.project_closures;
create trigger project_closures_set_updated_at
before update on app.project_closures
for each row execute function app.set_updated_at();

drop trigger if exists customer_care_reminders_set_updated_at on app.customer_care_reminders;
create trigger customer_care_reminders_set_updated_at
before update on app.customer_care_reminders
for each row execute function app.set_updated_at();

drop trigger if exists suppliers_set_updated_at on app.suppliers;
create trigger suppliers_set_updated_at
before update on app.suppliers
for each row execute function app.set_updated_at();

drop trigger if exists products_set_updated_at on app.products;
create trigger products_set_updated_at
before update on app.products
for each row execute function app.set_updated_at();

drop trigger if exists warehouses_set_updated_at on app.warehouses;
create trigger warehouses_set_updated_at
before update on app.warehouses
for each row execute function app.set_updated_at();

drop trigger if exists purchase_orders_set_updated_at on app.purchase_orders;
create trigger purchase_orders_set_updated_at
before update on app.purchase_orders
for each row execute function app.set_updated_at();

drop trigger if exists purchase_order_items_set_updated_at on app.purchase_order_items;
create trigger purchase_order_items_set_updated_at
before update on app.purchase_order_items
for each row execute function app.set_updated_at();

drop trigger if exists stock_receipts_set_updated_at on app.stock_receipts;
create trigger stock_receipts_set_updated_at
before update on app.stock_receipts
for each row execute function app.set_updated_at();

drop trigger if exists stock_receipt_items_set_updated_at on app.stock_receipt_items;
create trigger stock_receipt_items_set_updated_at
before update on app.stock_receipt_items
for each row execute function app.set_updated_at();

drop trigger if exists sales_orders_set_updated_at on app.sales_orders;
create trigger sales_orders_set_updated_at
before update on app.sales_orders
for each row execute function app.set_updated_at();

drop trigger if exists sales_order_items_set_updated_at on app.sales_order_items;
create trigger sales_order_items_set_updated_at
before update on app.sales_order_items
for each row execute function app.set_updated_at();

drop trigger if exists receivables_set_updated_at on app.receivables;
create trigger receivables_set_updated_at
before update on app.receivables
for each row execute function app.set_updated_at();

insert into app.catalog_categories (code, name, description, is_system)
values
  ('customer_status', 'Trang thai khach hang', 'Trang thai vong doi khach hang.', true),
  ('customer_type', 'Loai khach hang', 'Phan loai khach hang dich vu, thuong mai hoac ca hai.', true),
  ('opportunity_stage', 'Giai doan co hoi', 'Cac giai doan xu ly co hoi ban hang.', true),
  ('quote_status', 'Trang thai bao gia', 'Trang thai xu ly bao gia.', true),
  ('contract_status', 'Trang thai hop dong', 'Trang thai vong doi hop dong.', true),
  ('project_status', 'Trang thai du an', 'Trang thai thuc hien du an.', true),
  ('task_status', 'Trang thai cong viec', 'Trang thai cong viec du an.', true),
  ('schedule_type', 'Loai lich', 'Loai lich chung.', true),
  ('receivable_status', 'Trang thai cong no', 'Trang thai theo doi khoan phai thu.', true),
  ('care_status', 'Trang thai cham soc', 'Trang thai lich cham soc khach hang.', true),
  ('purchase_status', 'Trang thai mua hang', 'Trang thai phieu mua hang.', true),
  ('stock_receipt_status', 'Trang thai nhap kho', 'Trang thai phieu nhap kho.', true),
  ('sales_order_status', 'Trang thai ban hang', 'Trang thai don ban hang.', true),
  ('unit', 'Don vi tinh', 'Danh muc don vi tinh.', true),
  ('department', 'Phong ban', 'Danh muc phong ban van hanh.', true)
on conflict (code) do nothing;

insert into app.company_settings (
  singleton_key,
  company_name,
  nav_name,
  short_name,
  nav_subtitle,
  address,
  hotline,
  email,
  website,
  representative_title
)
values (
  'default',
  'CÔNG TY PHÁT TRIỂN THƯƠNG MẠI FREELAND',
  'Freeland CRM',
  'FL',
  'Commerce Edition',
  'Toà nhà Lotte, 54 Liễu Giai, Ba Đình, Hà Nội',
  '1900-XXXX',
  'crm@freeland.vn',
  'freeland.vn',
  'Đại diện pháp luật'
)
on conflict (singleton_key) do nothing;

insert into app.catalog_items (category_id, code, name, sort_order, is_system)
select category.id, item.code, item.name, item.sort_order, true
from app.catalog_categories category
join (
  values
    ('customer_status', 'new', 'Moi', 10),
    ('customer_status', 'nurturing', 'Dang cham soc', 20),
    ('customer_status', 'active_project', 'Dang co du an', 30),
    ('customer_status', 'paused', 'Tam dung', 40),
    ('customer_status', 'stopped', 'Ngung hop tac', 50),
    ('customer_type', 'service', 'Dich vu', 10),
    ('customer_type', 'commerce', 'Thuong mai', 20),
    ('customer_type', 'both', 'Ca hai', 30),
    ('opportunity_stage', 'new', 'Moi tao', 10),
    ('opportunity_stage', 'consulting', 'Dang tu van', 20),
    ('opportunity_stage', 'info_sent', 'Da gui thong tin', 30),
    ('opportunity_stage', 'waiting_quote', 'Cho bao gia', 40),
    ('opportunity_stage', 'quoted', 'Da tao bao gia', 50),
    ('opportunity_stage', 'paused', 'Tam dung', 60),
    ('opportunity_stage', 'lost', 'That bai', 70),
    ('opportunity_stage', 'won', 'Thanh cong', 80),
    ('quote_status', 'draft', 'Nhap', 10),
    ('quote_status', 'sent', 'Da gui khach', 20),
    ('quote_status', 'revision_requested', 'Khach yeu cau sua', 30),
    ('quote_status', 'approved', 'Da duyet', 40),
    ('quote_status', 'rejected', 'Khach tu choi', 50),
    ('quote_status', 'converted', 'Da chuyen hop dong', 60),
    ('contract_status', 'draft', 'Nhap', 10),
    ('contract_status', 'sent', 'Da gui khach', 20),
    ('contract_status', 'negotiating', 'Dang dam phan', 30),
    ('contract_status', 'signed', 'Da ky', 40),
    ('contract_status', 'paused', 'Tam dung', 50),
    ('contract_status', 'cancelled', 'Huy', 60),
    ('contract_status', 'completed', 'Hoan tat', 70),
    ('project_status', 'new', 'Moi tao', 10),
    ('project_status', 'waiting_deployment', 'Cho trien khai', 20),
    ('project_status', 'in_progress', 'Dang thuc hien', 30),
    ('project_status', 'paused', 'Tam dung', 40),
    ('project_status', 'waiting_acceptance', 'Cho nghiem thu', 50),
    ('project_status', 'accepted', 'Da nghiem thu', 60),
    ('project_status', 'closed', 'Da dong', 70),
    ('project_status', 'cancelled', 'Huy', 80),
    ('task_status', 'todo', 'Chua lam', 10),
    ('task_status', 'in_progress', 'Dang lam', 20),
    ('task_status', 'waiting_feedback', 'Cho phan hoi', 30),
    ('task_status', 'completed', 'Hoan thanh', 40),
    ('task_status', 'overdue', 'Qua han', 50),
    ('task_status', 'cancelled', 'Huy', 60),
    ('schedule_type', 'meeting', 'Lich hop', 10),
    ('schedule_type', 'survey', 'Lich khao sat', 20),
    ('schedule_type', 'deployment', 'Lich trien khai', 30),
    ('schedule_type', 'acceptance', 'Lich nghiem thu', 40),
    ('schedule_type', 'customer_care', 'Lich cham soc', 50),
    ('schedule_type', 'other', 'Lich khac', 60),
    ('receivable_status', 'not_due', 'Chua den han', 10),
    ('receivable_status', 'due_soon', 'Sap den han', 20),
    ('receivable_status', 'due_today', 'Den han hom nay', 30),
    ('receivable_status', 'overdue', 'Qua han', 40),
    ('receivable_status', 'partially_paid', 'Da thu mot phan', 50),
    ('receivable_status', 'paid', 'Da thu du', 60),
    ('receivable_status', 'cancelled', 'Huy / khong thu', 70),
    ('care_status', 'scheduled', 'Chua den ngay', 10),
    ('care_status', 'due_today', 'Can cham soc hom nay', 20),
    ('care_status', 'completed', 'Da cham soc', 30),
    ('care_status', 'rescheduled', 'Hen lai', 40),
    ('care_status', 'skipped', 'Bo qua', 50),
    ('purchase_status', 'draft', 'Nhap', 10),
    ('purchase_status', 'ordered', 'Da dat hang', 20),
    ('purchase_status', 'partially_received', 'Da nhan mot phan', 30),
    ('purchase_status', 'received', 'Da nhan du', 40),
    ('purchase_status', 'cancelled', 'Huy', 50),
    ('stock_receipt_status', 'draft', 'Nhap', 10),
    ('stock_receipt_status', 'confirmed', 'Da xac nhan', 20),
    ('stock_receipt_status', 'cancelled', 'Huy', 30),
    ('sales_order_status', 'draft', 'Nhap', 10),
    ('sales_order_status', 'confirmed', 'Da xac nhan', 20),
    ('sales_order_status', 'delivered', 'Da giao hang', 30),
    ('sales_order_status', 'partially_paid', 'Da thu mot phan', 40),
    ('sales_order_status', 'paid', 'Da thu du', 50),
    ('sales_order_status', 'cancelled', 'Huy', 60),
    ('unit', 'item', 'Cai', 10),
    ('unit', 'hour', 'Gio', 20),
    ('unit', 'day', 'Ngay', 30),
    ('unit', 'package', 'Goi', 40)
) as item(category_code, code, name, sort_order)
  on category.code = item.category_code
on conflict (category_id, code) do nothing;

insert into app.roles (code, name, description, is_system)
values
  ('system_management', 'System Management', 'Quan ly nguoi dung, vai tro, quyen va cau hinh.', true),
  ('business_management', 'Business Management', 'Theo doi CRM, hop dong, du an va bao cao.', true),
  ('sales_operation', 'Sales Operation', 'Van hanh khach hang, co hoi, bao gia, hop dong va cham soc.', true),
  ('project_operation', 'Project Operation', 'Van hanh du an, cong viec, lich va nghiem thu.', true),
  ('finance_operation', 'Finance Operation', 'Theo doi cong no, thanh toan va bao cao tai chinh.', true),
  ('inventory_commerce_operation', 'Inventory And Commerce Operation', 'Van hanh nha cung ung, mua hang, kho va ban hang.', true)
on conflict (code) do nothing;

insert into app.permissions (code, module, action, scope, description)
values
  ('dashboard.view.all', 'dashboard', 'view', 'all', 'Xem dashboard toan he thong.'),
  ('customers.view.own', 'customers', 'view', 'own', 'Xem khach hang minh phu trach.'),
  ('customers.view.team', 'customers', 'view', 'team', 'Xem khach hang cua nhom.'),
  ('customers.view.all', 'customers', 'view', 'all', 'Xem tat ca khach hang.'),
  ('customers.create.all', 'customers', 'create', 'all', 'Tao khach hang.'),
  ('customers.update.own', 'customers', 'update', 'own', 'Cap nhat khach hang minh phu trach.'),
  ('customers.delete.all', 'customers', 'delete', 'all', 'Xoa hoac khoa khach hang.'),
  ('customer_contacts.view.own', 'customer_contacts', 'view', 'own', 'Xem nguoi lien he khach hang minh phu trach.'),
  ('customer_contacts.create.all', 'customer_contacts', 'create', 'all', 'Tao nguoi lien he.'),
  ('opportunities.view.own', 'opportunities', 'view', 'own', 'Xem co hoi minh phu trach.'),
  ('opportunities.create.all', 'opportunities', 'create', 'all', 'Tao co hoi.'),
  ('quotes.view.team', 'quotes', 'view', 'team', 'Xem bao gia trong pham vi nhom.'),
  ('quotes.create.all', 'quotes', 'create', 'all', 'Tao bao gia.'),
  ('quotes.approve.team', 'quotes', 'approve', 'team', 'Duyet bao gia trong pham vi nhom.'),
  ('contracts.view.team', 'contracts', 'view', 'team', 'Xem hop dong trong pham vi nhom.'),
  ('contracts.create.all', 'contracts', 'create', 'all', 'Tao hop dong.'),
  ('contracts.sign.all', 'contracts', 'sign', 'all', 'Xac nhan hop dong da ky.'),
  ('projects.view.team', 'projects', 'view', 'team', 'Xem du an trong pham vi nhom.'),
  ('projects.assign.team', 'projects', 'assign', 'team', 'Phan cong du an trong pham vi nhom.'),
  ('tasks.view.own', 'tasks', 'view', 'own', 'Xem cong viec duoc giao.'),
  ('tasks.update.own', 'tasks', 'update', 'own', 'Cap nhat cong viec duoc giao.'),
  ('schedules.view.own', 'schedules', 'view', 'own', 'Xem lich cua minh.'),
  ('internal_notes.view.own', 'internal_notes', 'view', 'own', 'Xem ghi chu gui den hoac lien quan.'),
  ('receivables.view.team', 'receivables', 'view', 'team', 'Xem cong no trong pham vi nhom.'),
  ('receivables.update_status.all', 'receivables', 'update_status', 'all', 'Cap nhat trang thai cong no.'),
  ('customer_care.view.own', 'customer_care', 'view', 'own', 'Xem lich cham soc cua minh.'),
  ('suppliers.view.all', 'suppliers', 'view', 'all', 'Xem nha cung ung.'),
  ('purchases.create.all', 'purchases', 'create', 'all', 'Tao phieu mua hang.'),
  ('stock_receipts.create.all', 'stock_receipts', 'create', 'all', 'Tao phieu nhap kho.'),
  ('inventory.view.all', 'inventory', 'view', 'all', 'Xem ton kho.'),
  ('inventory.adjust.all', 'inventory', 'adjust', 'all', 'Dieu chinh ton kho.'),
  ('sales_orders.create.all', 'sales_orders', 'create', 'all', 'Tao don ban hang.'),
  ('reports.view.team', 'reports', 'view', 'team', 'Xem bao cao trong pham vi nhom.'),
  ('reports.export.team', 'reports', 'export', 'team', 'Xuat bao cao trong pham vi nhom.'),
  ('settings.configure.all', 'settings', 'configure', 'all', 'Thay doi cau hinh he thong.'),
  ('users.update.all', 'users', 'update', 'all', 'Quan ly nguoi dung.'),
  ('roles.configure.all', 'roles', 'configure', 'all', 'Quan ly vai tro va quyen.'),
  ('audit_logs.view.all', 'audit_logs', 'view', 'all', 'Xem nhat ky he thong.')
on conflict (code) do nothing;
