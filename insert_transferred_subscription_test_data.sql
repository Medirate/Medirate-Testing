-- Insert test data for devreddy923@gmail.com in transferred_subscriptions table
-- This user will be a sub-user under a primary user

INSERT INTO transferred_subscriptions (
    primary_user_email,
    sub_user_email,
    subscription_start_date,
    subscription_end_date,
    status,
    transfer_date
) VALUES (
    'dev@metasysconsulting.com',  -- Primary user email
    'devreddy923@gmail.com',      -- Sub-user email (the transferred user)
    '2024-01-01 00:00:00+00',     -- Subscription start date
    '2025-12-31 23:59:59+00',     -- Subscription end date (active until end of 2025)
    'active',                      -- Status
    NOW()                          -- Transfer date (now)
);

-- Verify the insertion
SELECT * FROM transferred_subscriptions WHERE sub_user_email = 'devreddy923@gmail.com';
