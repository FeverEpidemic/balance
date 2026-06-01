create or replace function private.wallet_member_limit()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 5;
$$;

create or replace function private.lock_wallet_capacity(target_wallet_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(target_wallet_id::text, 0));
end;
$$;

create or replace function private.wallet_member_count(target_wallet_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.wallet_members
  where wallet_id = target_wallet_id;
$$;

create or replace function private.wallet_pending_invitation_count(
  target_wallet_id uuid,
  excluded_invitation_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.wallet_invitations
  where wallet_id = target_wallet_id
    and status = 'pending'
    and (excluded_invitation_id is null or id <> excluded_invitation_id);
$$;

create or replace function private.wallet_occupied_slots(
  target_wallet_id uuid,
  excluded_invitation_id uuid default null
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select private.wallet_member_count(target_wallet_id) + private.wallet_pending_invitation_count(target_wallet_id, excluded_invitation_id);
$$;

create or replace function private.raise_wallet_member_limit()
returns void
language plpgsql
set search_path = ''
as $$
begin
  raise exception using
    errcode = 'P0001',
    message = 'wallet_member_limit_reached';
end;
$$;

create or replace function private.enforce_wallet_invitation_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_wallet_capacity(new.wallet_id);

  if new.status = 'pending' and (tg_op = 'INSERT' or old.status is distinct from 'pending') then
    if private.wallet_occupied_slots(new.wallet_id, case when tg_op = 'UPDATE' then new.id else null end) >= private.wallet_member_limit() then
      perform private.raise_wallet_member_limit();
    end if;
  end if;

  return new;
end;
$$;

create or replace function private.enforce_wallet_member_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.lock_wallet_capacity(new.wallet_id);

  if tg_op = 'INSERT'
    or old.wallet_id is distinct from new.wallet_id
    or old.user_id is distinct from new.user_id then
    if private.wallet_occupied_slots(new.wallet_id) >= private.wallet_member_limit() then
      perform private.raise_wallet_member_limit();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists wallet_invitation_capacity_guard on public.wallet_invitations;
create trigger wallet_invitation_capacity_guard
before insert or update on public.wallet_invitations
for each row
execute function private.enforce_wallet_invitation_capacity();

drop trigger if exists wallet_member_capacity_guard on public.wallet_members;
create trigger wallet_member_capacity_guard
before insert or update on public.wallet_members
for each row
execute function private.enforce_wallet_member_capacity();

create or replace function public.accept_wallet_invitation_atomic(
  invitation_token text,
  accepting_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation_row public.wallet_invitations%rowtype;
  existing_member_id uuid;
begin
  select *
  into invitation_row
  from public.wallet_invitations
  where token = invitation_token
  for update;

  if not found then
    raise exception 'Undangan tidak ditemukan.';
  end if;

  perform private.lock_wallet_capacity(invitation_row.wallet_id);

  if invitation_row.status = 'accepted' then
    return invitation_row.wallet_id;
  end if;

  if invitation_row.status = 'revoked' then
    raise exception 'Undangan ini sudah dibatalkan oleh pemilik wallet.';
  end if;

  if invitation_row.expires_at < timezone('utc', now()) then
    update public.wallet_invitations
    set status = 'expired',
        updated_by = accepting_user_id
    where id = invitation_row.id;

    raise exception 'Undangan ini sudah kedaluwarsa.';
  end if;

  select id
  into existing_member_id
  from public.wallet_members
  where wallet_id = invitation_row.wallet_id
    and user_id = accepting_user_id
  limit 1;

  update public.wallet_invitations
  set status = 'accepted',
      accepted_by = accepting_user_id,
      updated_by = accepting_user_id
  where id = invitation_row.id;

  if existing_member_id is null then
    insert into public.wallet_members (
      wallet_id,
      user_id,
      role,
      created_by,
      updated_by
    )
    values (
      invitation_row.wallet_id,
      accepting_user_id,
      invitation_row.role,
      accepting_user_id,
      accepting_user_id
    );
  end if;

  return invitation_row.wallet_id;
end;
$$;

revoke all on function private.wallet_member_limit() from public, anon, authenticated;
revoke all on function private.lock_wallet_capacity(uuid) from public, anon, authenticated;
revoke all on function private.wallet_member_count(uuid) from public, anon, authenticated;
revoke all on function private.wallet_pending_invitation_count(uuid, uuid) from public, anon, authenticated;
revoke all on function private.wallet_occupied_slots(uuid, uuid) from public, anon, authenticated;
revoke all on function private.raise_wallet_member_limit() from public, anon, authenticated;
revoke all on function private.enforce_wallet_invitation_capacity() from public, anon, authenticated;
revoke all on function private.enforce_wallet_member_capacity() from public, anon, authenticated;

revoke all on function public.accept_wallet_invitation_atomic(text, uuid) from public, anon, authenticated;
grant execute on function public.accept_wallet_invitation_atomic(text, uuid) to service_role;
