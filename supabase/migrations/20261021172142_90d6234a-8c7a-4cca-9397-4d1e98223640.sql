alter table public.support_catalog add column if not exists cta_whatsapp_message text;

update public.support_catalog
set cta_label = 'Ver horários',
    cta_whatsapp_message = 'Olá, desejo agendar um horário de psicoterapia.'
where slug = 'pla_psicoterapia';

update public.support_catalog
set cta_label = 'Ver horários',
    cta_whatsapp_message = 'Olá, desejo agendar um horário de psiquiatria.'
where slug = 'pla_psiquiatria';

update public.support_catalog
set cta_label = 'Ver horários',
    cta_whatsapp_message = 'Olá, desejo agendar um horário de psicopedagogia.'
where slug = 'pla_psicoped';