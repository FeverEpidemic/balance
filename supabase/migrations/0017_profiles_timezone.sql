alter table public.profiles
add column timezone text;

comment on column public.profiles.timezone is 'Manual override untuk timezone user (IANA format, e.g. Asia/Jakarta). Null berarti auto-detect dari browser.';
