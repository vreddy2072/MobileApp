-- FUNCTION 2: add_tokens_rc (from revenuecat: Accepts p_app_id)
-- This function is designed to be called by the Edge Function, translating app_id to app_name.
CREATE OR REPLACE FUNCTION public.add_tokens_rc(
    p_user_id character varying,
    p_app_id text, -- Changed to TEXT to create a distinct function signature
    p_source text,
    p_product_id text,
    p_receipt text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_app_name character varying;
BEGIN
    -- 1. Get the app_name from the public.apps table using the provided p_app_id
    SELECT app_name
    INTO v_app_name
    FROM public.apps
    WHERE app_id = p_app_id;

    -- 2. If app_name is not found (i.e., p_app_id is invalid), raise an exception.
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid App ID: Application ID "%" is not registered in public.apps (404)', p_app_id
        USING HINT = 'Ensure the app_id is correct and registered in the public.apps table.';
    END IF;

    -- 3. Call the core add_tokens function (Function 1).
    -- Function 1 will handle the quantity lookup, product validation, and transaction execution.
    PERFORM public.add_tokens(
        p_user_id := p_user_id,
        p_app_name := v_app_name, -- Pass the found app_name
        p_source := p_source,
        p_product_id := p_product_id, -- Pass the product_id for quantity lookup in Function 1
        p_receipt := p_receipt
    );
END;
$$;