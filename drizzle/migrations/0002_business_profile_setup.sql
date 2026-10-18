ALTER TABLE public.businesses
  ADD COLUMN country text NOT NULL DEFAULT 'Zimbabwe',
  ADD COLUMN timezone text NOT NULL DEFAULT 'Africa/Harare',
  ADD COLUMN website text NOT NULL DEFAULT '',
  ADD COLUMN social_links text NOT NULL DEFAULT '';

CREATE FUNCTION public.save_business_profile(profile_data jsonb, business_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  bid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF jsonb_typeof(profile_data) IS DISTINCT FROM 'object'
    OR jsonb_typeof(business_data) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'Invalid business profile';
  END IF;
  IF length(trim(coalesce(business_data->>'name', ''))) < 2
    OR length(coalesce(business_data->>'name', '')) > 120 THEN
    RAISE EXCEPTION 'Invalid business name';
  END IF;
  IF length(trim(coalesce(profile_data->>'display_name', ''))) < 2 THEN
    RAISE EXCEPTION 'Invalid profile name';
  END IF;
  IF length(trim(profile_data->>'display_name')) > 120
    OR length(coalesce(profile_data->>'avatar_url', '')) > 2048
    OR (coalesce(profile_data->>'avatar_url', '') <> '' AND profile_data->>'avatar_url' !~ '^https://[^[:space:]/]+')
    OR length(coalesce(business_data->>'country', 'Zimbabwe')) NOT BETWEEN 2 AND 100
    OR length(coalesce(business_data->>'timezone', 'Africa/Harare')) NOT BETWEEN 3 AND 100
    OR length(coalesce(business_data->>'website', '')) > 2048
    OR (coalesce(business_data->>'website', '') <> '' AND business_data->>'website' !~ '^https://[^[:space:]/]+')
    OR length(coalesce(business_data->>'industry', '')) > 120
    OR length(coalesce(business_data->>'description', '')) > 4000
    OR length(coalesce(business_data->>'address', '')) > 1000
    OR length(coalesce(business_data->>'social_links', '')) > 2000
    OR length(coalesce(business_data->>'contact_email', '')) > 320
    OR (coalesce(business_data->>'contact_email', '') <> '' AND business_data->>'contact_email' !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
    OR length(coalesce(business_data->>'contact_phone', '')) > 50
    OR length(coalesce(business_data->>'operating_hours', '')) > 1000
    OR length(coalesce(business_data->>'products', '')) > 20000
    OR length(coalesce(business_data->>'faqs', '')) > 20000
    OR length(coalesce(business_data->>'delivery_policy', '')) > 4000
    OR length(coalesce(business_data->>'ai_instructions', '')) > 10000
    OR length(coalesce(business_data->>'whatsapp_phone_number_id', '')) > 100
    OR length(coalesce(business_data->>'whatsapp_business_account_id', '')) > 100
    OR coalesce(business_data->>'currency', 'USD') NOT IN ('USD', 'ZWG', 'ZAR', 'EUR', 'GBP')
    OR coalesce(business_data->>'language', 'English') NOT IN ('English', 'Shona', 'Ndebele') THEN
    RAISE EXCEPTION 'Invalid business profile fields';
  END IF;

  INSERT INTO public.profiles(id, display_name, avatar_url)
  VALUES (uid, trim(profile_data->>'display_name'), coalesce(profile_data->>'avatar_url', ''))
  ON CONFLICT (id) DO UPDATE SET
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url;

  INSERT INTO public.businesses (
    owner_id, name, industry, country, timezone, description, address, website,
    social_links, contact_email, contact_phone, operating_hours, currency,
    language, notifications, products, faqs, delivery_policy, ai_instructions,
    whatsapp_phone_number_id, whatsapp_business_account_id
  ) VALUES (
    uid, trim(business_data->>'name'), coalesce(business_data->>'industry', ''),
    coalesce(business_data->>'country', 'Zimbabwe'), coalesce(business_data->>'timezone', 'Africa/Harare'),
    coalesce(business_data->>'description', ''), coalesce(business_data->>'address', ''),
    coalesce(business_data->>'website', ''), coalesce(business_data->>'social_links', ''),
    coalesce(business_data->>'contact_email', ''), coalesce(business_data->>'contact_phone', ''),
    coalesce(business_data->>'operating_hours', ''), coalesce(business_data->>'currency', 'USD'),
    coalesce(business_data->>'language', 'English'), coalesce((business_data->>'notifications')::boolean, true),
    coalesce(business_data->>'products', ''), coalesce(business_data->>'faqs', ''),
    coalesce(business_data->>'delivery_policy', ''), coalesce(business_data->>'ai_instructions', ''),
    coalesce(business_data->>'whatsapp_phone_number_id', ''), coalesce(business_data->>'whatsapp_business_account_id', '')
  ) ON CONFLICT (owner_id) DO UPDATE SET
    name = excluded.name,
    industry = excluded.industry,
    country = excluded.country,
    timezone = excluded.timezone,
    description = excluded.description,
    address = excluded.address,
    website = excluded.website,
    social_links = excluded.social_links,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    operating_hours = excluded.operating_hours,
    currency = excluded.currency,
    language = excluded.language,
    notifications = excluded.notifications,
    products = excluded.products,
    faqs = excluded.faqs,
    delivery_policy = excluded.delivery_policy,
    ai_instructions = excluded.ai_instructions,
    whatsapp_phone_number_id = excluded.whatsapp_phone_number_id,
    whatsapp_business_account_id = excluded.whatsapp_business_account_id
  RETURNING id INTO bid;

  INSERT INTO public.user_roles(user_id, business_id, role)
  VALUES (uid, bid, 'owner')
  ON CONFLICT (user_id, business_id) DO NOTHING;

  RETURN bid;
END;
$$;

REVOKE ALL ON FUNCTION public.save_business_profile(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_business_profile(jsonb, jsonb) TO authenticated;
