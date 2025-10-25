-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  address text NOT NULL UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  notes text,
  network smallint NOT NULL DEFAULT '0'::smallint,
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.dids (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  launcher_id text NOT NULL UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  notes text,
  network smallint NOT NULL DEFAULT '0'::smallint,
  name text,
  CONSTRAINT dids_pkey PRIMARY KEY (id),
  CONSTRAINT dids_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.theme_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  theme_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  file_use_type USER-DEFINED NOT NULL,
  mime_type text NOT NULL,
  file bytea NOT NULL,
  CONSTRAINT theme_files_pkey PRIMARY KEY (id),
  CONSTRAINT theme_files_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id)
);
CREATE TABLE public.themes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  theme jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  notes text,
  name text NOT NULL DEFAULT ''''''::text,
  display_name text NOT NULL DEFAULT '''New Theme'''::text,
  is_draft boolean NOT NULL DEFAULT true,
  CONSTRAINT themes_pkey PRIMARY KEY (id),
  CONSTRAINT themes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text,
  role text,
  created_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  email_confirmed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE UNIQUE INDEX addresses_pkey ON public.addresses USING btree (id);
CREATE UNIQUE INDEX addresses_address_key ON public.addresses USING btree (address);
CREATE INDEX addresses_user_id_idx ON public.addresses USING btree (user_id);

CREATE UNIQUE INDEX dids_pkey ON public.dids USING btree (id);
CREATE UNIQUE INDEX dids_launcher_id_key ON public.dids USING btree (launcher_id);
CREATE INDEX dids_user_id_idx ON public.dids USING btree (user_id);

CREATE UNIQUE INDEX themes_pkey ON public.themes USING btree (id);
CREATE UNIQUE INDEX themes_user_id_name_key ON public.themes USING btree (user_id, name);
CREATE INDEX themes_user_id_idx ON public.themes USING btree (user_id);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);
CREATE UNIQUE INDEX theme_files_theme_id_file_use_type_key ON public.theme_files USING btree (theme_id, file_use_type);
