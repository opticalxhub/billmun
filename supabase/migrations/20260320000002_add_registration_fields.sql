-- Add preferred committee and allocated country fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_committee TEXT,
ADD COLUMN IF NOT EXISTS allocated_country TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_preferred_committee ON users(preferred_committee);
CREATE INDEX IF NOT EXISTS idx_users_allocated_country ON users(allocated_country);

-- Add comment for documentation
COMMENT ON COLUMN users.preferred_committee IS 'User preferred committee selection during registration';
COMMENT ON COLUMN users.allocated_country IS 'User preferred country selection during registration';
