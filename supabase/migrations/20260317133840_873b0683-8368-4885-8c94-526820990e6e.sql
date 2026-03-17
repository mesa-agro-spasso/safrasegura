
CREATE TABLE public.daily_table_params (
  id text PRIMARY KEY DEFAULT 'default',
  market_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  global_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  combinations jsonb NOT NULL DEFAULT '[]'::jsonb,
  saved_at timestamp with time zone NOT NULL DEFAULT now(),
  generated_at timestamp with time zone
);

ALTER TABLE public.daily_table_params ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access" ON public.daily_table_params FOR SELECT TO public USING (true);
CREATE POLICY "Allow all insert access" ON public.daily_table_params FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow all update access" ON public.daily_table_params FOR UPDATE TO public USING (true);

-- Seed the default row
INSERT INTO public.daily_table_params (id) VALUES ('default');
