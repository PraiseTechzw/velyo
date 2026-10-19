-- Additive Veylo WhatsApp + Paynow module. Existing messaging tables are preserved.
-- The existing public.messages table belongs to the inbox; this module's standalone
-- records use veylo_messages to avoid a destructive name collision.
CREATE TABLE public.veylo_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL DEFAULT '',
  waba_id text NOT NULL,
  phone_number_id text NOT NULL UNIQUE,
  display_number text NOT NULL DEFAULT '',
  access_token_encrypted text NOT NULL,
  verify_token text NOT NULL DEFAULT 'praise123',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'disconnected', 'error')),
  messages_used integer NOT NULL DEFAULT 0 CHECK (messages_used >= 0),
  subscription_status text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'pending', 'active', 'past_due', 'cancelled')),
  subscription_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX veylo_clients_phone_number_id_idx ON public.veylo_clients(phone_number_id);
CREATE INDEX veylo_clients_user_id_idx ON public.veylo_clients(user_id);

CREATE TABLE public.veylo_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.veylo_clients(id) ON DELETE CASCADE,
  from_number text NOT NULL DEFAULT '',
  to_number text NOT NULL DEFAULT '',
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  text_content text NOT NULL DEFAULT '',
  whatsapp_message_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX veylo_messages_client_created_idx ON public.veylo_messages(client_id, created_at DESC);

CREATE TABLE public.veylo_settings (
  client_id uuid PRIMARY KEY REFERENCES public.veylo_clients(id) ON DELETE CASCADE,
  paynow_integration_id text NOT NULL DEFAULT '',
  paynow_key_encrypted text NOT NULL DEFAULT '',
  paynow_pass_fees boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.veylo_clients(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  paynow_reference text NOT NULL UNIQUE,
  poll_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX payments_client_created_idx ON public.payments(client_id, created_at DESC);

ALTER TABLE public.veylo_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veylo_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veylo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Credentials and module records are intentionally server-only. Authenticated browser
-- clients have no grants or policies; API handlers authenticate the user first.
REVOKE ALL ON public.veylo_clients, public.veylo_messages, public.veylo_settings, public.payments FROM anon, authenticated;
GRANT ALL ON public.veylo_clients, public.veylo_messages, public.veylo_settings, public.payments TO service_role;

CREATE FUNCTION public.increment_veylo_messages_used(p_client_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.veylo_clients SET messages_used = messages_used + 1 WHERE id = p_client_id;
$$;
REVOKE ALL ON FUNCTION public.increment_veylo_messages_used(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_veylo_messages_used(uuid) TO service_role;

