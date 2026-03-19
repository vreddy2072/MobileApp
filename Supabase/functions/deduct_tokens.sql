-- FUNCTION: deduct_tokens
-- Attempts to deduct a specified cost (p_cost) from a user's token balance 
-- for a specific application (p_app_name). Returns TRUE on success, FALSE otherwise.
CREATE OR REPLACE FUNCTION public.deduct_tokens(
    p_user_id character varying, -- User ID
    p_app_name character varying, -- Application identifier (e.g., 'NoteBro')
    p_cost integer -- Token cost of the operation
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    current_balance integer;
BEGIN
    -- Validate input: p_cost must be a positive value
    if p_cost is null or p_cost <= 0 then
        raise exception 'p_cost must be greater than 0.';
    end if;

    -- Lock the row (ai_tokens) corresponding to the user and app to prevent race conditions 
    -- during concurrent operations (e.g., another deduction or an addition).
    SELECT balance
    INTO current_balance
    FROM public.ai_tokens
    WHERE user_id = p_user_id and app_name = p_app_name
    FOR UPDATE;

    -- Check 1: No wallet row found (user has never been issued tokens for this app)
    if current_balance is null then
        -- We choose to return FALSE rather than raising an exception, 
        -- allowing the calling application to handle the "no wallet" state.
        return false;
    end if;

    -- Check 2: Insufficient balance
    if current_balance < p_cost then
        -- Return FALSE if the deduction cannot be completed.
        return false;
    end if;

    -- Deduction: If we reach here, the balance is sufficient.
    -- Deduct the cost and update lifetime usage.
    UPDATE public.ai_tokens
    SET 
        balance        = balance - p_cost,
        -- Note: lifetime_usage is often tracked for additions, but tracking deductions 
        -- is also useful for analytics, depending on the schema's purpose.
        lifetime_usage = lifetime_usage + p_cost, 
        updated_at     = timezone('utc'::text, now())
    WHERE user_id = p_user_id and app_name = p_app_name;

    -- The transaction is successful
    RETURN true;
END;
$$;