
-- pricing_combinations: each row = one cell in the pricing table
CREATE TABLE public.pricing_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,

  commodity text NOT NULL CHECK (commodity IN ('soybean', 'corn')),
  warehouse_id text NOT NULL,
  display_name text NOT NULL,

  payment_date date NOT NULL,
  grain_reception_date date,
  sale_date date NOT NULL,

  trade_date_override date,

  target_basis numeric NOT NULL DEFAULT 0,

  ticker text NOT NULL,
  exp_date date NOT NULL,

  futures_price numeric NOT NULL,
  exchange_rate numeric,

  interest_rate numeric NOT NULL DEFAULT 1.4,
  interest_rate_period text NOT NULL DEFAULT 'monthly',

  storage_cost numeric NOT NULL DEFAULT 3.5,
  storage_cost_type text NOT NULL DEFAULT 'fixed',

  reception_cost numeric NOT NULL DEFAULT 0,

  brokerage_per_contract numeric NOT NULL DEFAULT 15.0,

  desk_cost_pct numeric NOT NULL DEFAULT 0.003,

  shrinkage_rate_monthly numeric NOT NULL DEFAULT 0,

  risk_free_rate numeric NOT NULL DEFAULT 0.149,
  sigma numeric NOT NULL DEFAULT 0.35,
  option_type text NOT NULL DEFAULT 'call',

  additional_discount_brl numeric NOT NULL DEFAULT 0,

  rounding_increment numeric NOT NULL DEFAULT 0.50,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- RLS: public access (no auth yet)
ALTER TABLE public.pricing_combinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access" ON public.pricing_combinations FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert access" ON public.pricing_combinations FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.pricing_combinations FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete access" ON public.pricing_combinations FOR DELETE TO public USING (true);

-- auto-update updated_at
CREATE TRIGGER update_pricing_combinations_updated_at
  BEFORE UPDATE ON public.pricing_combinations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- insurance_profiles: configurable insurance levels
CREATE TABLE public.insurance_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level integer NOT NULL DEFAULT 0,
  pricing_mode text NOT NULL DEFAULT 'atm' CHECK (pricing_mode IN ('atm', 'otm_5', 'otm_10')),
  manual_markup_brl numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.insurance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access" ON public.insurance_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert access" ON public.insurance_profiles FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.insurance_profiles FOR UPDATE TO public USING (true);
CREATE POLICY "Allow all delete access" ON public.insurance_profiles FOR DELETE TO public USING (true);

CREATE TRIGGER update_insurance_profiles_updated_at
  BEFORE UPDATE ON public.insurance_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default insurance profiles
INSERT INTO public.insurance_profiles (name, level, pricing_mode, manual_markup_brl) VALUES
  ('Sem Seguro', 0, 'atm', 0),
  ('Seguro ATM', 1, 'atm', 0),
  ('Seguro OTM 5%', 2, 'otm_5', 0),
  ('Seguro OTM 10%', 3, 'otm_10', 0);
