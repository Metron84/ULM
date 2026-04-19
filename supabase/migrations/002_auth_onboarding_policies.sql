-- Auth onboarding policies for public.users.

alter table public.users enable row level security;

drop policy if exists "users_can_read_own_profile" on public.users;
create policy "users_can_read_own_profile"
on public.users
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "users_can_insert_own_profile" on public.users;
create policy "users_can_insert_own_profile"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "users_can_update_own_profile" on public.users;
create policy "users_can_update_own_profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
