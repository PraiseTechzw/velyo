CREATE TABLE public.whatsapp_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  phone_number_id text NOT NULL UNIQUE,
  business_account_id text NOT NULL,
  display_phone_number text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'disconnected', 'error')),
  last_error text NOT NULL DEFAULT '',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  wa_id text NOT NULL,
  display_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, wa_id),
  UNIQUE (id, business_id)
);
CREATE INDEX contacts_business_name_idx ON public.contacts(business_id, display_name);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  handling_mode text NOT NULL DEFAULT 'human' CHECK (handling_mode IN ('ai', 'human')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (contact_id, business_id) REFERENCES public.contacts(id, business_id) ON DELETE CASCADE,
  UNIQUE (id, business_id)
);
CREATE INDEX conversations_inbox_idx ON public.conversations(business_id, status, last_message_at DESC);
CREATE UNIQUE INDEX conversations_one_open_per_contact_idx ON public.conversations(business_id, contact_id) WHERE status = 'open';

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL,
  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type text NOT NULL DEFAULT 'text',
  content_text text NOT NULL DEFAULT '',
  provider_message_id text,
  delivery_status text NOT NULL CHECK (delivery_status IN ('received', 'queued', 'sent', 'delivered', 'read', 'failed')),
  error_code text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (conversation_id, business_id) REFERENCES public.conversations(id, business_id) ON DELETE CASCADE,
  UNIQUE (business_id, provider_message_id)
);
CREATE INDEX messages_conversation_history_idx ON public.messages(business_id, conversation_id, occurred_at DESC, id DESC);

CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  phone_number_id text NOT NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processing_status text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed', 'abandoned')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  last_error text NOT NULL DEFAULT '',
  next_attempt_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);
CREATE INDEX whatsapp_events_retry_idx ON public.whatsapp_webhook_events(processing_status, next_attempt_at)
  WHERE processing_status = 'failed';

ALTER TABLE public.whatsapp_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.whatsapp_integrations, public.contacts, public.conversations, public.messages TO authenticated;
GRANT ALL ON public.whatsapp_integrations, public.contacts, public.conversations, public.messages, public.whatsapp_webhook_events TO service_role;
REVOKE ALL ON public.whatsapp_webhook_events FROM anon, authenticated;

CREATE POLICY "Members read WhatsApp integration status" ON public.whatsapp_integrations
  FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members read business contacts" ON public.contacts
  FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members read business conversations" ON public.conversations
  FOR SELECT TO authenticated USING (public.is_business_member(business_id));
CREATE POLICY "Members read business messages" ON public.messages
  FOR SELECT TO authenticated USING (public.is_business_member(business_id));

CREATE FUNCTION public.process_whatsapp_event(
  p_event_key text,
  p_phone_number_id text,
  p_event_type text,
  p_payload jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  integration_row public.whatsapp_integrations%ROWTYPE;
  event_row public.whatsapp_webhook_events%ROWTYPE;
  contact_row public.contacts%ROWTYPE;
  conversation_id uuid;
  provider_id text;
  provider_status text;
  happened_at timestamptz;
  inserted_count integer;
BEGIN
  IF length(p_event_key) < 32 OR length(p_event_key) > 128
    OR length(p_phone_number_id) < 1 OR length(p_phone_number_id) > 100
    OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object'
    OR p_event_type NOT IN ('message', 'status') THEN
    RAISE EXCEPTION 'Invalid webhook event';
  END IF;

  SELECT * INTO integration_row FROM public.whatsapp_integrations
    WHERE phone_number_id = p_phone_number_id AND status IN ('pending', 'connected');
  IF NOT FOUND THEN
    RETURN jsonb_build_object('accepted', false, 'reason', 'integration_not_connected');
  END IF;

  INSERT INTO public.whatsapp_webhook_events(event_key, phone_number_id, business_id, event_type, payload, processing_status)
  VALUES (p_event_key, p_phone_number_id, integration_row.business_id, p_event_type, p_payload, 'processing')
  ON CONFLICT (event_key) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    SELECT * INTO event_row FROM public.whatsapp_webhook_events WHERE event_key = p_event_key FOR UPDATE;
    IF event_row.processing_status IN ('processed', 'processing') OR event_row.attempts >= 5 THEN
      RETURN jsonb_build_object('accepted', true, 'duplicate', true);
    END IF;
    UPDATE public.whatsapp_webhook_events SET processing_status = 'processing', attempts = attempts + 1,
      payload = p_payload, last_error = '' WHERE id = event_row.id;
  ELSE
    UPDATE public.whatsapp_webhook_events SET attempts = 1 WHERE event_key = p_event_key;
  END IF;

  BEGIN
    IF p_event_type = 'message' THEN
      provider_id := p_payload->>'id';
      IF provider_id IS NULL OR p_payload->>'from' IS NULL THEN
        RAISE EXCEPTION 'Message event has no provider ID or sender';
      END IF;
      happened_at := to_timestamp(coalesce((p_payload->>'timestamp')::double precision, extract(epoch FROM now())));

      INSERT INTO public.contacts(business_id, wa_id, display_name)
      VALUES (integration_row.business_id, p_payload->>'from', coalesce(p_payload->>'contact_name', ''))
      ON CONFLICT (business_id, wa_id) DO UPDATE SET
        display_name = CASE WHEN excluded.display_name <> '' THEN excluded.display_name ELSE contacts.display_name END,
        updated_at = now()
      RETURNING * INTO contact_row;

      SELECT id INTO conversation_id FROM public.conversations
      WHERE business_id = integration_row.business_id AND contact_id = contact_row.id AND status = 'open'
      ORDER BY last_message_at DESC LIMIT 1 FOR UPDATE;
      IF conversation_id IS NULL THEN
        INSERT INTO public.conversations(business_id, contact_id, handling_mode, last_message_at)
        VALUES (integration_row.business_id, contact_row.id, 'human', happened_at)
        ON CONFLICT (business_id, contact_id) WHERE status = 'open'
        DO UPDATE SET last_message_at = excluded.last_message_at
        RETURNING id INTO conversation_id;
      END IF;

      INSERT INTO public.messages(business_id, conversation_id, direction, message_type, content_text,
        provider_message_id, delivery_status, occurred_at)
      VALUES (integration_row.business_id, conversation_id, 'inbound', coalesce(p_payload->>'type', 'unknown'),
        coalesce(p_payload->'text'->>'body', ''), provider_id, 'received', happened_at)
      ON CONFLICT (business_id, provider_message_id) DO NOTHING;
      UPDATE public.conversations SET last_message_at = greatest(last_message_at, happened_at) WHERE id = conversation_id;
    ELSE
      provider_id := p_payload->>'id';
      provider_status := p_payload->>'status';
      IF provider_id IS NULL OR provider_status NOT IN ('sent', 'delivered', 'read', 'failed') THEN
        RAISE EXCEPTION 'Invalid status event';
      END IF;
      UPDATE public.messages SET delivery_status = CASE
          WHEN provider_status = 'read' THEN 'read'
          WHEN provider_status = 'delivered' AND delivery_status <> 'read' THEN 'delivered'
          WHEN provider_status = 'sent' AND delivery_status NOT IN ('delivered', 'read') THEN 'sent'
          WHEN provider_status = 'failed' AND delivery_status NOT IN ('sent', 'delivered', 'read') THEN 'failed'
          ELSE delivery_status
        END,
        error_code = coalesce(p_payload->'errors'->0->>'code', '')
      WHERE business_id = integration_row.business_id AND provider_message_id = provider_id
        AND direction = 'outbound';
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Status references an unknown outgoing message';
      END IF;
    END IF;

    UPDATE public.whatsapp_integrations SET status = 'connected', verified_at = coalesce(verified_at, now()),
      last_error = '', updated_at = now() WHERE id = integration_row.id;
    UPDATE public.whatsapp_webhook_events SET processing_status = 'processed', processed_at = now(),
      next_attempt_at = NULL, last_error = '', payload = '{}'::jsonb WHERE event_key = p_event_key;
    RETURN jsonb_build_object('accepted', true, 'duplicate', false);
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.whatsapp_webhook_events SET processing_status = CASE WHEN attempts >= 5 THEN 'abandoned' ELSE 'failed' END,
      last_error = left(SQLERRM, 500),
      payload = CASE WHEN attempts >= 5 THEN '{}'::jsonb ELSE payload END,
      next_attempt_at = CASE WHEN attempts >= 5 THEN NULL ELSE now() + make_interval(secs => least(300, 5 * (2 ^ attempts)::integer)) END
    WHERE event_key = p_event_key;
    RETURN jsonb_build_object('accepted', false, 'retryable', attempts < 5);
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.process_whatsapp_event(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_whatsapp_event(text, text, text, jsonb) TO service_role;

CREATE FUNCTION public.retry_failed_whatsapp_events(p_batch_size integer DEFAULT 20)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_row public.whatsapp_webhook_events%ROWTYPE;
  retried integer := 0;
BEGIN
  IF p_batch_size < 1 OR p_batch_size > 100 THEN RAISE EXCEPTION 'Invalid retry batch size'; END IF;
  FOR event_row IN
    SELECT * FROM public.whatsapp_webhook_events
    WHERE processing_status = 'failed' AND attempts < 5 AND next_attempt_at <= now()
    ORDER BY next_attempt_at, received_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.process_whatsapp_event(event_row.event_key, event_row.phone_number_id,
      event_row.event_type, event_row.payload);
    retried := retried + 1;
  END LOOP;
  RETURN retried;
END;
$$;
REVOKE ALL ON FUNCTION public.retry_failed_whatsapp_events(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.retry_failed_whatsapp_events(integer) TO service_role;

CREATE FUNCTION public.prepare_whatsapp_message(p_conversation_id uuid, p_text text)
RETURNS TABLE (message_id uuid, business_id uuid, phone_number_id text, recipient text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  conversation_row public.conversations%ROWTYPE;
  integration_row public.whatsapp_integrations%ROWTYPE;
  created_message uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF length(trim(coalesce(p_text, ''))) < 1 OR length(p_text) > 4096 THEN
    RAISE EXCEPTION 'Message must contain 1–4096 characters';
  END IF;
  SELECT c.* INTO conversation_row FROM public.conversations c
    JOIN public.user_roles r ON r.business_id = c.business_id AND r.user_id = uid
    WHERE c.id = p_conversation_id AND c.status = 'open' FOR UPDATE OF c;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conversation unavailable'; END IF;
  SELECT * INTO integration_row FROM public.whatsapp_integrations
    WHERE business_id = conversation_row.business_id AND status = 'connected';
  IF NOT FOUND THEN RAISE EXCEPTION 'WhatsApp is not connected'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.messages m WHERE m.conversation_id = conversation_row.id
      AND m.business_id = conversation_row.business_id AND m.direction = 'inbound'
      AND m.occurred_at >= now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'The 24-hour customer service window has closed. Use an approved WhatsApp template.';
  END IF;

  INSERT INTO public.messages(business_id, conversation_id, direction, message_type, content_text, delivery_status, occurred_at)
  VALUES (conversation_row.business_id, conversation_row.id, 'outbound', 'text', trim(p_text), 'queued', now())
  RETURNING id INTO created_message;
  UPDATE public.conversations SET last_message_at = now() WHERE id = conversation_row.id;
  RETURN QUERY SELECT created_message, conversation_row.business_id, integration_row.phone_number_id,
    (SELECT c.wa_id FROM public.contacts c WHERE c.id = conversation_row.contact_id AND c.business_id = conversation_row.business_id);
END;
$$;
REVOKE ALL ON FUNCTION public.prepare_whatsapp_message(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.prepare_whatsapp_message(uuid, text) TO authenticated;

CREATE FUNCTION public.list_whatsapp_inbox(p_limit integer DEFAULT 50, p_before timestamptz DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_limit < 1 OR p_limit > 100 THEN RAISE EXCEPTION 'Invalid page size'; END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(page_row) ORDER BY page_row.last_message_at DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT c.id, c.business_id, c.status, c.handling_mode, c.assigned_to, c.last_message_at,
      jsonb_build_object('id', ct.id, 'wa_id', ct.wa_id, 'display_name', ct.display_name) AS contact,
      coalesce((
        SELECT jsonb_agg(to_jsonb(message_row) ORDER BY message_row.occurred_at ASC)
        FROM (
          SELECT m.id, m.direction, m.message_type, m.content_text, m.delivery_status,
            m.error_code, m.occurred_at, m.provider_message_id
          FROM public.messages m
          WHERE m.conversation_id = c.id AND m.business_id = c.business_id
          ORDER BY m.occurred_at DESC, m.id DESC LIMIT 1
        ) message_row
      ), '[]'::jsonb) AS messages
    FROM public.conversations c
    JOIN public.contacts ct ON ct.id = c.contact_id AND ct.business_id = c.business_id
    JOIN public.user_roles r ON r.business_id = c.business_id AND r.user_id = uid
    WHERE (p_before IS NULL OR c.last_message_at < p_before)
    ORDER BY c.last_message_at DESC
    LIMIT p_limit
  ) page_row;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.list_whatsapp_inbox(integer, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_whatsapp_inbox(integer, timestamptz) TO authenticated;

CREATE FUNCTION public.list_whatsapp_messages(
  p_conversation_id uuid,
  p_limit integer DEFAULT 50,
  p_before_time timestamptz DEFAULT NULL,
  p_before_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_limit < 1 OR p_limit > 100 OR ((p_before_time IS NULL) <> (p_before_id IS NULL)) THEN
    RAISE EXCEPTION 'Invalid message page';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations c JOIN public.user_roles r ON r.business_id = c.business_id
    WHERE c.id = p_conversation_id AND r.user_id = uid
  ) THEN RAISE EXCEPTION 'Conversation unavailable'; END IF;

  WITH candidates AS (
    SELECT m.id, m.direction, m.message_type, m.content_text, m.delivery_status, m.error_code,
      m.occurred_at, m.provider_message_id,
      row_number() OVER (ORDER BY m.occurred_at DESC, m.id DESC) AS row_num
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
      AND (p_before_time IS NULL OR (m.occurred_at, m.id) < (p_before_time, p_before_id))
    ORDER BY m.occurred_at DESC, m.id DESC
    LIMIT p_limit + 1
  )
  SELECT jsonb_build_object(
    'items', coalesce(jsonb_agg(to_jsonb(candidates) - 'row_num' ORDER BY occurred_at, id)
      FILTER (WHERE row_num <= p_limit), '[]'::jsonb),
    'has_more', count(*) > p_limit
  ) INTO result FROM candidates;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.list_whatsapp_messages(uuid, integer, timestamptz, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_whatsapp_messages(uuid, integer, timestamptz, uuid) TO authenticated;

CREATE FUNCTION public.mark_whatsapp_message_sent(p_message_id uuid, p_provider_message_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_provider_message_id IS NULL OR length(p_provider_message_id) > 200 THEN
    RAISE EXCEPTION 'Invalid provider message ID';
  END IF;
  UPDATE public.messages m SET provider_message_id = p_provider_message_id, delivery_status = 'sent', error_code = ''
  WHERE m.id = p_message_id AND m.direction = 'outbound' AND m.delivery_status = 'queued';
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_whatsapp_message_sent(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_whatsapp_message_sent(uuid, text) TO service_role;

CREATE FUNCTION public.mark_whatsapp_message_failed(p_message_id uuid, p_error_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.messages m SET delivery_status = 'failed', error_code = left(coalesce(p_error_code, 'send_failed'), 100)
  WHERE m.id = p_message_id AND m.direction = 'outbound' AND m.delivery_status = 'queued';
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_whatsapp_message_failed(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_whatsapp_message_failed(uuid, text) TO service_role;

CREATE FUNCTION public.store_whatsapp_connection(
  p_business_id uuid,
  p_phone_number_id text,
  p_business_account_id text,
  p_display_phone_number text,
  p_encrypted_token text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_phone_number_id IS NULL OR length(p_phone_number_id) > 100
    OR p_business_account_id IS NULL OR length(p_business_account_id) > 100
    OR p_encrypted_token IS NULL OR length(p_encrypted_token) > 10000 THEN
    RAISE EXCEPTION 'Invalid WhatsApp connection details';
  END IF;

  INSERT INTO public.whatsapp_integrations(business_id, phone_number_id, business_account_id,
    display_phone_number, status, last_error, verified_at, updated_at)
  VALUES (p_business_id, p_phone_number_id, p_business_account_id,
    coalesce(p_display_phone_number, ''), 'pending', '', NULL, now())
  ON CONFLICT (business_id) DO UPDATE SET phone_number_id = excluded.phone_number_id,
    business_account_id = excluded.business_account_id, display_phone_number = excluded.display_phone_number,
    status = 'pending', last_error = '', verified_at = NULL, updated_at = now();

  UPDATE public.businesses SET whatsapp_phone_number_id = p_phone_number_id,
    whatsapp_business_account_id = p_business_account_id WHERE id = p_business_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Business not found'; END IF;

  INSERT INTO public.business_credentials(business_id, encrypted_token, updated_at)
  VALUES (p_business_id, p_encrypted_token, now())
  ON CONFLICT (business_id) DO UPDATE SET encrypted_token = excluded.encrypted_token, updated_at = now();
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.store_whatsapp_connection(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_whatsapp_connection(uuid, text, text, text, text) TO service_role;
