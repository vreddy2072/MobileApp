-- Function to create or update a user record, validating the app_name.
-- This function assumes the public.users table has a UNIQUE constraint or PRIMARY KEY on (user_id, app_name).
CREATE OR REPLACE FUNCTION public.upsert_user_login(
    p_user_id character varying,
    p_app_name character varying
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    app_exists boolean;
BEGIN
    -- 1. Check if p_app_name exists in the public.apps table (Integrity Check)
    SELECT EXISTS (
        SELECT 1
        FROM public.apps
        WHERE app_name = p_app_name
    ) INTO app_exists;

    IF NOT app_exists THEN
        RAISE EXCEPTION 'Referential integrity violation: App name "%" is not registered in public.apps (404)', p_app_name
        USING HINT = 'Ensure the app is registered before logging a user against it.';
    END IF;

    -- 2. Upsert the user record
    -- The conflict target is now (user_id, app_name) to track login status per application.
    INSERT INTO public.users (user_id, app_name)
    VALUES (p_user_id, p_app_name)
    ON CONFLICT (user_id, app_name) DO UPDATE
    SET
        updated_at = current_timestamp;
        -- Note: We don't need to update app_name here since it is part of the conflict key,
        -- but keeping app_name = EXCLUDED.app_name is harmless.
        -- app_name = EXCLUDED.app_name; 

    -- 3. Upsert to user record in vocabpro.users table
    INSERT INTO vocabpro.users (id, created_at)
    VALUES (p_user_id::uuid, current_timestamp)
    ON CONFLICT (id) DO UPDATE
    SET
        updated_at = current_timestamp;    

END;
$$;