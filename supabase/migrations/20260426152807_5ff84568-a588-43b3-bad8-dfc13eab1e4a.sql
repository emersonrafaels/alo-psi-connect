
UPDATE public.whatsapp_profile_links wpl
SET tenant_id = p.tenant_id
FROM public.profiles p
WHERE wpl.user_id = p.user_id
  AND wpl.tenant_id IS DISTINCT FROM p.tenant_id;

UPDATE public.mood_entries
SET tenant_id = '472db0ac-0f45-4998-97da-490bc579efb1'
WHERE user_id = '470164ee-cd69-46f3-b118-1ec3e48a0dab'
  AND tenant_id = '3a9ae5ec-50a9-4674-b808-7735e5f0afb5';
