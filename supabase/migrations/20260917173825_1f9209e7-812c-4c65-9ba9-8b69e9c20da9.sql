-- Recalibrate EBMSP demo mood data and triage queue (data only)
with students as (
  select pi.patient_id, p.profile_id,
         row_number() over (order by pi.patient_id) as rnk
  from patient_institutions pi
  join pacientes p on p.id = pi.patient_id
  where pi.institution_id = '09301ab9-4687-4920-8daf-0cbb9c9280e8'
    and pi.enrollment_status = 'enrolled'
    and p.profile_id is not null
),
targets as (
  select patient_id, profile_id, rnk,
         case when rnk <= 12 then 'critical'
              when rnk <= 35 then 'alert'
              when rnk <= 70 then 'attention'
              else 'healthy' end as band
  from students
)
update mood_entries me
set mood_score = case t.band
      when 'critical' then 1 + (case when abs(hashtext(me.id::text)) % 4 = 0 then 1 else 0 end)
      when 'alert' then 2 + (case when abs(hashtext(me.id::text)) % 3 = 0 then 1 else 0 end)
      when 'attention' then 3 + (case when abs(hashtext(me.id::text)) % 4 = 0 then 1 else 0 end)
      else 4 + (case when abs(hashtext(me.id::text)) % 3 = 0 then 1 else 0 end) end,
    anxiety_level = case t.band
      when 'critical' then 5 - (case when abs(hashtext(me.id::text)) % 5 = 0 then 1 else 0 end)
      when 'alert' then 3 + (abs(hashtext(me.id::text)) % 2)
      when 'attention' then 3 + (case when abs(hashtext(me.id::text)) % 5 = 0 then 1 else 0 end)
      else 2 - (case when abs(hashtext(me.id::text)) % 4 = 0 then 1 else 0 end) end,
    energy_level = case t.band
      when 'critical' then 1 + (case when abs(hashtext(me.id::text)) % 3 = 0 then 1 else 0 end)
      when 'alert' then 2 + (case when abs(hashtext(me.id::text)) % 3 = 0 then 1 else 0 end)
      when 'attention' then 3 + (case when abs(hashtext(me.id::text)) % 4 = 0 then 1 else 0 end)
      else 4 + (case when abs(hashtext(me.id::text)) % 3 = 0 then 1 else 0 end) end,
    sleep_quality = case t.band
      when 'critical' then 1 + (case when abs(hashtext(me.id::text)) % 3 = 0 then 1 else 0 end)
      when 'alert' then 2 + (case when abs(hashtext(me.id::text)) % 4 = 0 then 1 else 0 end)
      when 'attention' then 3
      else 4 + (case when abs(hashtext(me.id::text)) % 4 = 0 then 1 else 0 end) end,
    updated_at = now()
from targets t
where me.profile_id = t.profile_id
  and me.date >= current_date - 45;

-- Keep Buddy analyses coherent with the new diary values
update mood_entry_analyses a
set risk_level = (case
      when me.mood_score <= 2 and me.anxiety_level >= 4 then 'critical'
      when me.mood_score <= 3 then 'alert'
      when me.anxiety_level >= 4 then 'attention'
      else 'healthy' end)::mood_analysis_risk_level,
    updated_at = now()
from mood_entries me
join pacientes p on p.profile_id = me.profile_id
join patient_institutions pi on pi.patient_id = p.id
where a.mood_entry_id = me.id
  and pi.institution_id = '09301ab9-4687-4920-8daf-0cbb9c9280e8'
  and me.date >= current_date - 45;

-- Leave 15 at-risk students awaiting triage (6 critical + 9 alert)
with students as (
  select pi.patient_id, row_number() over (order by pi.patient_id) as rnk
  from patient_institutions pi
  join pacientes p on p.id = pi.patient_id
  where pi.institution_id = '09301ab9-4687-4920-8daf-0cbb9c9280e8'
    and pi.enrollment_status = 'enrolled'
    and p.profile_id is not null
)
delete from student_triage st
using students s
where st.patient_id = s.patient_id
  and st.institution_id = '09301ab9-4687-4920-8daf-0cbb9c9280e8'
  and (s.rnk between 1 and 6 or s.rnk between 13 and 21);