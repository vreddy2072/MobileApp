-- FUNCTION: check_app_exists
-- Checks if an application is registered by name and returns 1 if it exists, 0 otherwise.
CREATE OR REPLACE FUNCTION public.check_app_exists(
    p_app_name character varying
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    app_count integer;
BEGIN
    -- Use COUNT(*) to check how many rows match the app_name.
    SELECT COUNT(*)
    INTO app_count
    FROM public.apps
    WHERE app_name = p_app_name;

    -- If the count is 1 (or more), return 1. Otherwise, return 0.
    RETURN CASE 
                WHEN app_count > 0 THEN 1
                ELSE 0
           END;
END;
$$;