drop index if exists public.idx_wallet_invitations_wallet_email;

create index if not exists idx_wallet_invitations_wallet_status_created_at
  on public.wallet_invitations (wallet_id, status, created_at desc);

drop policy if exists "wallet_invitations_select_wallet_members" on public.wallet_invitations;
drop policy if exists "wallet_invitations_update_owner_or_invited" on public.wallet_invitations;

alter table public.wallet_invitations
  drop column if exists invited_email;

create policy "wallet_invitations_select_wallet_members" on public.wallet_invitations
for select to authenticated
using (private.is_wallet_member(wallet_id));

create policy "wallet_invitations_update_owner_or_invited" on public.wallet_invitations
for update to authenticated
using (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]))
with check (private.has_wallet_role(wallet_id, array['owner']::public.wallet_role[]));
