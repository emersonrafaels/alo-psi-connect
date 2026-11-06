CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (user_id, nome, email, tipo_usuario)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(NEW.raw_user_meta_data->>'nome',''), NULLIF(NEW.raw_user_meta_data->>'full_name',''), NULLIF(NEW.raw_user_meta_data->>'name',''), split_part(NEW.email,'@',1)),
      NEW.email,
      CASE WHEN NEW.raw_user_meta_data->>'tipo_usuario' IN ('paciente','profissional') THEN NEW.raw_user_meta_data->>'tipo_usuario' ELSE 'paciente' END
    )
    ON CONFLICT DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user_profile failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

INSERT INTO public.profiles (user_id, nome, email, tipo_usuario)
SELECT u.id,
  COALESCE(NULLIF(u.raw_user_meta_data->>'nome',''), NULLIF(u.raw_user_meta_data->>'full_name',''), NULLIF(u.raw_user_meta_data->>'name',''), split_part(u.email,'@',1)),
  u.email,
  CASE WHEN u.raw_user_meta_data->>'tipo_usuario' IN ('paciente','profissional') THEN u.raw_user_meta_data->>'tipo_usuario' ELSE 'paciente' END
FROM auth.users u
WHERE u.email IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT DO NOTHING;