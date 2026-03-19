-- FUNCTION 1: add_tokens (Accepts p_app_name, Looks up quantity)
-- This is the core transactional function.
CREATE OR REPLACE FUNCTION public.add_tokens(
    p_user_id character varying,
    p_app_name character varying,
    p_source text,
    p_product_id text,
    p_receipt text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_app_exists boolean;
    v_quantity integer; -- Variable to store the looked-up credits/quantity
BEGIN
    -- 1. Check if p_app_name exists in the public.apps table
    SELECT EXISTS (
        SELECT 1
        FROM public.apps
        WHERE app_name = p_app_name
    ) INTO v_app_exists;

    -- If the app_name does NOT exist, raise an exception and halt the function.
    IF NOT v_app_exists THEN
        RAISE EXCEPTION 'Referential integrity violation: App name "%" is not registered in public.apps (404)', p_app_name
        USING HINT = 'Register the app_name in the public.apps table before using it.';
    END IF;

    -- 2. Look up the quantity (credits) and validate the product is active for this app_name
    SELECT ip.credits
    INTO v_quantity
    FROM public.iap_products ip
    WHERE 
        ip.app_name = p_app_name 
        AND ip.product_id = p_product_id
        AND ip.is_active = TRUE; -- Ensures we only transact for active products

    -- 3. Check if product was found, is active, and belongs to the app
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product Invalid: Product ID "%" is inactive or not found for App "%". (404)', p_product_id, p_app_name
        USING HINT = 'Ensure p_product_id is valid and active in iap_products.';
    END IF;

    -- 4. Create wallet if missing (Initializes balance and lifetime_usage to 0)
    INSERT INTO public.ai_tokens(user_id, app_name, balance, lifetime_usage)
    VALUES (p_user_id, p_app_name, 0, 0)
    ON CONFLICT (user_id, app_name) DO NOTHING;

    -- 5. Add tokens using the looked-up quantity and update lifetime usage
    UPDATE public.ai_tokens
    SET 
        balance = balance + v_quantity,
        lifetime_usage = lifetime_usage + v_quantity,
        updated_at = timezone('utc'::text, now())
    WHERE 
        user_id = p_user_id
        AND app_name = p_app_name;

    -- 6. Log transaction
    INSERT INTO public.iap_transactions(user_id, purchase_source, product_id, quantity, receipt, app_name)
    VALUES (p_user_id, p_source, p_product_id, v_quantity, p_receipt, p_app_name);
END;
$$;