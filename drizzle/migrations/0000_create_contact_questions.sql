CREATE TABLE public.contact_questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
 email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 business text NOT NULL DEFAULT '' CHECK (char_length(business) <= 150),
 message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 1 AND 2000)
);
GRANT INSERT (name, email, business, message) ON public.contact_questions TO anon, authenticated;
GRANT ALL ON public.contact_questions TO service_role;
ALTER TABLE public.contact_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Visitors can submit questions" ON public.contact_questions FOR INSERT TO anon, authenticated WITH CHECK (true);
COMMENT ON TABLE public.contact_questions IS 'Private prospective-customer questions. Visitors may submit but cannot read, update or delete any question.';