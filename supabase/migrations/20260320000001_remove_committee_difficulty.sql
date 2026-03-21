-- Remove difficulty column from Committee table
ALTER TABLE "Committee" DROP COLUMN IF EXISTS "difficulty";

-- Drop the CommitteeDifficulty enum type
DROP TYPE IF EXISTS "CommitteeDifficulty";
