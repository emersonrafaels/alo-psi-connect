import { useTenant } from './useTenant';

/**
 * Returns whether prices should be shown across public-facing pages.
 * Defaults to true (backwards-compatible) when the tenant flag is unset.
 * Prices are still shown on the payment step (BookingConfirmation) regardless.
 */
export const useShowPrices = (): boolean => {
  const { tenant } = useTenant();
  return (tenant as any)?.show_professional_prices !== false;
};
