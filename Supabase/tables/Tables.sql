-- Here is sample DDL for application 'NoteBro'. Please change below:
-- app name (from iOS Appstore connect), app_id (from RevenueCat), app bundle (from iOS Appstore connect), pricing (from iOS Appstore connect)
drop table if exists apps cascade;
drop table if exists ai_usage_log cascade;
drop table if exists ai_tokens cascade;
drop table if exists iap_products cascade;
drop table if exists iap_transactions cascade;
drop table if exists users cascade;
drop table if exists ai_app_configs cascade;

create table if not exists public.apps (
  app_name character varying not null, -- Friendly name (e.g., "NoteBro")
  app_id character varying null, -- RevenueCat app_id (e.g., "app6d23f53079")
  bundle_id character varying null, -- iOS Bundle ID (e.g., "com.notebro.app")
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint apps_pkey primary key (app_name),
  constraint apps_app_id_key unique (app_id),
  constraint apps_bundle_id_key unique (bundle_id)
) TABLESPACE pg_default;

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

/**
insert into public.apps 
(app_name, app_id, bundle_id)
values
  ('NoteBro', 'app6d23f53079', 'com.notebro.app');
*/


-- user table
create table public.users (
user_id varchar not null,                       -- Supabase Auth user id (UUID)
app_name varchar not null,
created_at timestamptz default now(),
updated_at timestamptz,
primary key (user_id, app_name));
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- AI Tokens (User Wallet)
create table public.ai_tokens (
  user_id varchar not null,                    -- Supabase Auth user id (UUID)
  app_name varchar not null,
  balance integer not null default 0,
  lifetime_usage integer not null default 0,
  updated_at timestamptz default now(),

  primary key (user_id, app_name),
  constraint fk_ai_tokens_user
    foreign key (user_id, app_name) references public.users(user_id, app_name)
      on delete cascade,
  constraint fk_ai_tokens_apps
    foreign key (app_name) references public.apps(app_name)
      on delete cascade
);
ALTER TABLE public.ai_tokens ENABLE ROW LEVEL SECURITY;

-- AI Usage Logs
create table public.ai_usage_log (
  id bigint generated always as identity primary key,

  user_id varchar not null,
  app_name varchar not null,                        -- NEW: which app consumed credits
  model varchar not null,

  input_tokens integer not null,
  output_tokens integer not null,
  cost_tokens integer not null,

  created_at timestamptz default now(),

  constraint fk_usage_log_user
    foreign key (user_id, app_name) references public.users(user_id, app_name)
      on delete cascade,
  constraint fk_ai_usage_log_apps
    foreign key (app_name) references public.apps(app_name)
      on delete cascade  
);
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

-- IAP Transactions
create table public.iap_transactions (
  id bigint generated always as identity primary key,

  user_id varchar not null,        -- you already have
  app_name varchar not null,         -- you already know
  product_id varchar not null,     -- known from the UI
  quantity integer not null,       -- from iap_products lookup
  purchase_source varchar not null,   -- ios | revenuecat | mock | admin

  transaction_id varchar,           -- from StoreKit OR RC
  receipt text,                     -- from StoreKit (optional)
  raw_payload jsonb,                -- RC webhook OR app payload

  status varchar default 'success', -- success | failed | duplicated
  error_message text,               -- if RPC fails

  created_at timestamptz default now(),

  constraint iap_tx_unique unique(transaction_id),
  constraint fk_iap_transactions_user
    foreign key (user_id, app_name) references public.users(user_id, app_name)
      on delete cascade,
  constraint fk_iap_transactions_apps
    foreign key (app_name) references public.apps(app_name)
      on delete cascade 
);
ALTER TABLE public.iap_transactions ENABLE ROW LEVEL SECURITY;

-- Speed up user/app/product lookups
create index idx_iap_tx_user on public.iap_transactions(user_id);
create index idx_iap_tx_app on public.iap_transactions(app_name);
create index idx_iap_tx_product on public.iap_transactions(product_id);

-- create policy "Users can read only their token wallet"
-- on ai_tokens
-- for select
-- using (auth.uid() = user_id);


-- create policy "Users cannot update tokens directly"
-- on ai_tokens
-- for update
-- using (false);


-- create policy "Users read own usage logs"
-- on ai_usage_log
-- for select
-- using (auth.uid() = user_id);

-- create policy "Users cannot insert usage logs"
-- on ai_usage_log
-- for insert
-- with check (false);

-- create policy "Users read own purchase history"
-- on iap_transactions
-- for select
-- using (auth.uid() = user_id);

-- create policy "Users cannot insert transactions"
-- on iap_transactions
-- for insert
-- with check (false);

-- create policy "Users cannot call add_tokens directly"
-- on ai_tokens
-- for update
-- using (false);

create table public.iap_products (
  id uuid default gen_random_uuid() primary key,

  app_name varchar not null,                    -- bundle id (NoteBro)
  product_id varchar not null,                  -- product name in iOS Store
  display_name varchar not null,
  description varchar,

  credits integer not null,                     -- how many credits users receive
  price_label varchar not null,                    -- for analytics only
  is_active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint unique_app_product unique (app_name, product_id),
  constraint fk_iap_products_apps
    foreign key (app_name) references public.apps(app_name)
      on delete cascade   
);
ALTER TABLE public.iap_products ENABLE ROW LEVEL SECURITY;

/**
insert into public.iap_products 
(app_name, product_id, display_name, credits, price_label, is_active, sort_order)
values
  ('NoteBro', 'credits.v1.pack1', 'Starter Pack', 200, '$0.99', true, 1),
  ('NoteBro', 'credits.v1.pack2', 'Value Pack', 700, '$2.99', true, 2),
  ('NoteBro', 'credits.v1.pack3', 'Mega Pack', 1200, '$4.99', true, 3);
*/

create table if not exists public.ai_app_configs (
  app_name character varying not null,
  system_prompt text not null,
  model character varying not null default 'gpt-4o-mini'::character varying,
  temperature numeric(3, 2) not null default 0.7,
  max_tokens integer not null default 1000,
  max_input_chars integer not null default 4000,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  mode character varying not null,
  constraint ai_app_configs_pkey primary key (app_name, mode),
  constraint ai_app_configs_app_name_fkey foreign KEY (app_name) references apps (app_name)
)

/**
INSERT INTO public.ai_app_configs (app_name, mode, system_prompt, model, temperature, max_tokens, max_input_chars, is_active)
VALUES (
  '<Your App Name>',
  'default',
  'You are <Your App Name>, a personal assistant. Your ONLY job is....',
  'gpt-4o-mini',
  0.7,
  1000,
  4000,
  TRUE
);
*/