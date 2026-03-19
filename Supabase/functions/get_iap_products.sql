-- FUNCTION: get_iap_products
-- Retrieves all active IAP products associated with a given application name,
-- ordered by the defined sort_order.
CREATE OR REPLACE FUNCTION public.get_iap_products(
    p_app_name character varying -- The name of the application to check products for
)
RETURNS SETOF public.iap_products -- Returns all columns from the iap_products table
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
        USING HINT = 'Ensure the app is registered before attempting to retrieve products.';
    END IF;

    -- 2. Retrieve active products for the given app_name, sorted by sort_order
    RETURN QUERY
    SELECT *
    FROM public.iap_products
    WHERE app_name = p_app_name AND is_active = TRUE
    ORDER BY sort_order ASC;

END;
$$;