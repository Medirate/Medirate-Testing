-- Insert transferred subscription data for ThinkBRG team
-- Primary user: kzeien@thinkbrg.com
-- Sub-users: ykubrom@thinkbrg.com, LStroger@thinkbrg.com, PDisman@thinkbrg.com
-- Subscription period: Yesterday to one year from now

-- Calculate dates
-- Yesterday: Current date - 1 day
-- One year from now: Current date + 1 year

INSERT INTO transferred_subscriptions (
    primary_user_email,
    sub_user_email,
    subscription_start_date,
    subscription_end_date,
    transfer_date,
    status
) VALUES 
-- Primary user record (no sub_user_email for the primary user)
(
    'kzeien@thinkbrg.com',
    NULL,
    CURRENT_DATE - INTERVAL '1 day', -- Yesterday
    CURRENT_DATE + INTERVAL '1 year', -- One year from now
    NOW(),
    'active'
),
-- Sub-user 1: ykubrom@thinkbrg.com
(
    'kzeien@thinkbrg.com',
    'ykubrom@thinkbrg.com',
    CURRENT_DATE - INTERVAL '1 day', -- Yesterday
    CURRENT_DATE + INTERVAL '1 year', -- One year from now
    NOW(),
    'active'
),
-- Sub-user 2: LStroger@thinkbrg.com
(
    'kzeien@thinkbrg.com',
    'LStroger@thinkbrg.com',
    CURRENT_DATE - INTERVAL '1 day', -- Yesterday
    CURRENT_DATE + INTERVAL '1 year', -- One year from now
    NOW(),
    'active'
),
-- Sub-user 3: PDisman@thinkbrg.com
(
    'kzeien@thinkbrg.com',
    'PDisman@thinkbrg.com',
    CURRENT_DATE - INTERVAL '1 day', -- Yesterday
    CURRENT_DATE + INTERVAL '1 year', -- One year from now
    NOW(),
    'active'
);

-- Verify the insertions
SELECT 
    primary_user_email,
    sub_user_email,
    subscription_start_date,
    subscription_end_date,
    transfer_date,
    status
FROM transferred_subscriptions 
WHERE primary_user_email = 'kzeien@thinkbrg.com'
ORDER BY sub_user_email;

