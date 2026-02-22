-- Clear stale prayer_times_cache entries missing Hijri date fields
-- Forces re-fetch from Aladhan API which includes all Hijri fields
DELETE FROM prayer_times_cache
WHERE NOT (times ? 'hijriDate') OR NOT (times ? 'hijriMonth');
