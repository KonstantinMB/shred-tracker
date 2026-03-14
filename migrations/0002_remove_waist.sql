-- Remove waist column from weight_logs (optional - only if column exists)
ALTER TABLE "weight_logs" DROP COLUMN IF EXISTS "waist";
