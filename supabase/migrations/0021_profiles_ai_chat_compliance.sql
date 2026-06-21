alter table public.profiles
add column ai_chat_enabled boolean not null default false,
add column ai_chat_consent_version text,
add column ai_chat_consented_at timestamptz;

comment on column public.profiles.ai_chat_enabled is 'User-controlled toggle for AI Chat. Defaults to false until consent is accepted.';
comment on column public.profiles.ai_chat_consent_version is 'Latest accepted compliance disclosure version for AI Chat.';
comment on column public.profiles.ai_chat_consented_at is 'Timestamp when the user accepted the current AI Chat disclosure.';
