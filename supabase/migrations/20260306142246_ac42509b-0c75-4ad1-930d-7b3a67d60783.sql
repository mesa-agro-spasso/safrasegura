-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequential_number INTEGER NOT NULL,
  operation_id TEXT,
  commodity TEXT NOT NULL CHECK (commodity IN ('soybean', 'corn')),
  exchange TEXT NOT NULL CHECK (exchange IN ('cbot', 'b3')),
  warehouse_id TEXT NOT NULL,
  warehouse_display_name TEXT NOT NULL,
  volume_sacks NUMERIC NOT NULL,
  volume_tons NUMERIC NOT NULL,
  volume_bushels NUMERIC,
  origination_price_net_brl NUMERIC NOT NULL,
  origination_price_gross_brl NUMERIC NOT NULL,
  futures_price NUMERIC NOT NULL,
  futures_price_currency TEXT NOT NULL CHECK (futures_price_currency IN ('USD', 'BRL')),
  exchange_rate NUMERIC,
  target_basis_brl NUMERIC NOT NULL DEFAULT 0,
  purchased_basis_brl NUMERIC NOT NULL DEFAULT 0,
  break_even_basis_brl NUMERIC NOT NULL DEFAULT 0,
  costs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ticker TEXT NOT NULL,
  exp_date TEXT NOT NULL,
  legs JSONB NOT NULL DEFAULT '[]'::jsonb,
  broker TEXT NOT NULL DEFAULT 'stonex',
  broker_account TEXT NOT NULL DEFAULT '17130',
  brokerage_per_contract NUMERIC NOT NULL DEFAULT 0,
  brokerage_currency TEXT NOT NULL CHECK (brokerage_currency IN ('USD', 'BRL')),
  payment_date TEXT NOT NULL,
  sale_date TEXT NOT NULL,
  order_message TEXT NOT NULL DEFAULT '',
  confirmation_message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('GENERATED', 'SENT', 'BROKER_CONFIRMED', 'LINKED', 'CANCELLED')) DEFAULT 'GENERATED',
  stonex_confirmation_text TEXT,
  stonex_confirmed_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- For now allow all access (no auth yet - user said they will add login later)
CREATE POLICY "Allow all read access" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow all insert access" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access" ON public.orders FOR DELETE USING (true);

-- Indexes
CREATE INDEX idx_orders_status ON public.orders (status);
CREATE INDEX idx_orders_commodity ON public.orders (commodity);
CREATE INDEX idx_orders_generated_at ON public.orders (generated_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();