-- Grant necessary permissions to anon role for guest bookings

-- Allow anon role to insert and select from agendamentos table
GRANT INSERT ON public.agendamentos TO anon;
GRANT SELECT ON public.agendamentos TO anon;

-- Allow anon role to select from profiles table (needed for RLS policies)
GRANT SELECT ON public.profiles TO anon;

-- Allow anon role to insert tracking events
GRANT INSERT ON public.user_booking_tracking TO anon;
GRANT SELECT ON public.user_booking_tracking TO anon;

-- Ensure anon can access professionals data for booking
GRANT SELECT ON public.profissionais TO anon;
GRANT SELECT ON public.profissionais_sessoes TO anon;

-- Grant access to views
GRANT SELECT ON public.vw_disponibilidades TO anon;
GRANT SELECT ON public.vw_profissionais_sessoes TO anon;