ALTER TABLE public.businesses
  ADD COLUMN assistant_name text NOT NULL DEFAULT '',
  ADD COLUMN assistant_tone text NOT NULL DEFAULT 'Friendly & Professional',
  ADD COLUMN assistant_language text NOT NULL DEFAULT 'English (US)',
  ADD COLUMN assistant_fallback_message text NOT NULL DEFAULT 'I am not sure about that. Let me check with our team and get back to you shortly.',
  ADD COLUMN answer_product_questions boolean NOT NULL DEFAULT true,
  ADD COLUMN provide_business_information boolean NOT NULL DEFAULT true,
  ADD COLUMN capture_leads boolean NOT NULL DEFAULT true,
  ADD COLUMN recommend_products boolean NOT NULL DEFAULT true,
  ADD COLUMN handle_order_inquiries boolean NOT NULL DEFAULT true,
  ADD COLUMN escalate_to_human boolean NOT NULL DEFAULT true;
EAAP2CulZCLiEBSzAMelLrVCyA0woPUy2nzxV5OUVZBZCah14xGsTeb6jadZCdfosQVfoeRjhxq1MTSxCZB4dypmboukTVDOYFlLcXIKcWiVZAprsLZBGaTx7fLn6ODngXqosNvF48i0rxFUWtkZAfpLZC3kADQFBeKYaeI8GnfoaoSZAz4S7kWkaWiizOYlI0ZA3IOBAwZDZD
