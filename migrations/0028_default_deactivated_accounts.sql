UPDATE users
SET account_status = 'deactivated',
    approval_status = 'approved',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE approval_status = 'pending';
