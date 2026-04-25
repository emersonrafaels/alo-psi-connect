
UPDATE public.mood_entries
SET tenant_id = '472db0ac-0f45-4998-97da-490bc579efb1'
WHERE user_id = '470164ee-cd69-46f3-b118-1ec3e48a0dab'
  AND tenant_id = '3a9ae5ec-50a9-4674-b808-7735e5f0afb5';

UPDATE public.profiles
SET tenant_id = '472db0ac-0f45-4998-97da-490bc579efb1'
WHERE user_id = '470164ee-cd69-46f3-b118-1ec3e48a0dab';
