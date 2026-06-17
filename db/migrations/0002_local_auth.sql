alter table app.users
add column if not exists password_hash text;

create index if not exists users_active_email_idx
on app.users (lower(email))
where deleted_at is null and status = 'active';
