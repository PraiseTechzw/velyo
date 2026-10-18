ALTER TABLE public.contacts
  ADD COLUMN is_lead boolean NOT NULL DEFAULT false,
  ADD COLUMN lead_status text NOT NULL DEFAULT 'New'
    CHECK (lead_status IN ('New', 'Contacted', 'Qualified', 'Won')),
  ADD COLUMN lead_interest text NOT NULL DEFAULT '',
  ADD COLUMN lead_source text NOT NULL DEFAULT 'WhatsApp'
    CHECK (lead_source IN ('WhatsApp', 'Manual'));

CREATE INDEX contacts_leads_workspace_idx
  ON public.contacts (business_id, lead_status, created_at DESC)
  WHERE is_lead = true;

GRANT INSERT, UPDATE ON public.contacts TO authenticated;

CREATE POLICY "Members create business contacts"
  ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_business_member(business_id));

CREATE POLICY "Members update business contacts"
  ON public.contacts
  FOR UPDATE TO authenticated
  USING (public.is_business_member(business_id))
  WITH CHECK (public.is_business_member(business_id));
