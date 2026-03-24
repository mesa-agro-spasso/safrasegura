
-- Fix triggers (drop if exist then recreate)
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_pricing_combinations_updated_at ON public.pricing_combinations;
DROP TRIGGER IF EXISTS update_insurance_profiles_updated_at ON public.insurance_profiles;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_combinations_updated_at
  BEFORE UPDATE ON public.pricing_combinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insurance_profiles_updated_at
  BEFORE UPDATE ON public.insurance_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
