-- Update existing users with quotas based on their subscription status
-- Run this after applying the migration

UPDATE "User"
SET 
  "videoQuotaLimit" = CASE
    WHEN "subscriptionStatus" = 'free' THEN 5
    WHEN "subscriptionStatus" = 'basic' THEN 50
    WHEN "subscriptionStatus" = 'pro' THEN 200
    WHEN "subscriptionStatus" = 'enterprise' THEN 999999
    ELSE 5
  END,
  "videosProcessed" = (
    SELECT COUNT(*) 
    FROM "Video" 
    WHERE "Video"."userId" = "User"."id" 
      AND "Video"."status" = 'completed'
  );

-- Verify the update
SELECT 
  "subscriptionStatus",
  COUNT(*) as user_count,
  AVG("videoQuotaLimit") as avg_quota,
  AVG("videosProcessed") as avg_processed
FROM "User"
GROUP BY "subscriptionStatus";
