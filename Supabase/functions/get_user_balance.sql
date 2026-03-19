-- FUNCTION: get_user_balance
-- Retrieves the current token balance for a specific user and application.
-- It performs an initial check and inserts a default wallet (balance=0) if none exists.
CREATE OR REPLACE FUNCTION public.get_user_balance(
    p_user_id character varying, -- The ID of the user whose balance is being checked
    p_app_name character varying -- The name of the application 
)
RETURNS numeric -- Using numeric to match standard balance types, although integer might be sufficient if tokens are never fractional.
LANGUAGE plpgsql
AS $$
DECLARE
    app_exists boolean;
    current_balance numeric;
BEGIN
    -- 1. Check if p_app_name exists in the public.apps table (Integrity Check)
    SELECT EXISTS (
        SELECT 1
        FROM public.apps
        WHERE app_name = p_app_name
    ) INTO app_exists;

    IF NOT app_exists THEN
        RAISE EXCEPTION 'Referential integrity violation: App name "%" is not registered in public.apps (404)', p_app_name
        USING HINT = 'Ensure the app is registered before attempting to get a balance.';
    END IF;

    -- 2. Insert or do nothing (ON CONFLICT) to ensure the wallet record exists.
    -- This initializes the balance to 0 and lifetime_usage to 0 for new users/apps.
    INSERT INTO public.ai_tokens (user_id, app_name, balance, lifetime_usage)
    VALUES (p_user_id, p_app_name, 0, 0)
    ON CONFLICT (user_id, app_name) 
    DO NOTHING;

    -- 3. Retrieve the final balance for the user/app combination
    SELECT balance
    INTO current_balance
    FROM public.ai_tokens
    WHERE user_id = p_user_id AND app_name = p_app_name;

    RETURN current_balance;

END;
$$;