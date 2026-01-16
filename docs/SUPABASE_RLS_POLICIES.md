# Supabase Row Level Security (RLS) Policies

This document provides comprehensive RLS policies for the SafeGuard application to ensure data security and user privacy.

## Overview

Row Level Security (RLS) is crucial for preventing unauthorized access to user data. These policies ensure that users can only access their own data and that the system is protected from common SQL injection attacks.

## Table: `emergency_recordings`

### Enable RLS
```sql
ALTER TABLE emergency_recordings ENABLE ROW LEVEL SECURITY;
```

### Policies

#### 1. Users can view their own recordings
```sql
CREATE POLICY "Users can view own recordings"
ON emergency_recordings
FOR SELECT
USING (auth.uid() = user_id);
```

#### 2. Users can insert their own recordings
```sql
CREATE POLICY "Users can insert own recordings"
ON emergency_recordings
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 3. Users can update their own recordings
```sql
CREATE POLICY "Users can update own recordings"
ON emergency_recordings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### 4. Users can delete their own recordings
```sql
CREATE POLICY "Users can delete own recordings"
ON emergency_recordings
FOR DELETE
USING (auth.uid() = user_id);
```

#### 5. Public access to shared recordings (read-only)
```sql
CREATE POLICY "Public can access shared recordings"
ON emergency_recordings
FOR SELECT
USING (
  shared_with IS NOT NULL
  AND shared_with ? auth.uid()::text
);
```

## Table: `user_profiles`

### Enable RLS
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

### Policies

#### 1. Users can view their own profile
```sql
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
USING (auth.uid() = id);
```

#### 2. Users can insert their own profile
```sql
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
```

#### 3. Users can update their own profile
```sql
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

#### 4. Users can delete their own profile
```sql
CREATE POLICY "Users can delete own profile"
ON user_profiles
FOR DELETE
USING (auth.uid() = id);
```

## Storage Bucket Policies

### Bucket: `emergency-videos`

#### 1. Users can upload videos
```sql
CREATE POLICY "Users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'emergency-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 2. Users can view their own videos
```sql
CREATE POLICY "Users can view own videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'emergency-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3. Users can delete their own videos
```sql
CREATE POLICY "Users can delete own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'emergency-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 4. Public access to shared videos
```sql
CREATE POLICY "Public can view shared videos"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'emergency-videos'
  AND (
    SELECT EXISTS (
      SELECT 1 FROM emergency_recordings
      WHERE emergency_recordings.video_path = storage.objects.name
      AND emergency_recordings.shared_with ? auth.uid()::text
    )
  )
);
```

## Function: Handle New User Signup

This function automatically creates a user profile when a new user signs up:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Security Enhancements

### 1. Add Indexes for Performance
```sql
-- Index for user-based queries
CREATE INDEX idx_emergency_recordings_user_id ON emergency_recordings(user_id);

-- Index for shared recordings
CREATE INDEX idx_emergency_recordings_shared_with ON emergency_recordings USING GIN(shared_with);

-- Index for temporal queries
CREATE INDEX idx_emergency_recordings_created_at ON emergency_recordings(created_at DESC);
```

### 2. Add Data Validation
```sql
-- Ensure valid emergency types
ALTER TABLE emergency_recordings
ADD CONSTRAINT check_emergency_type
CHECK (emergency_type IN ('pulled_over', 'danger'));

-- Ensure reasonable duration limits
ALTER TABLE emergency_recordings
ADD CONSTRAINT check_duration
CHECK (duration_seconds > 0 AND duration_seconds <= 3600); -- Max 1 hour

-- Ensure valid coordinates
ALTER TABLE emergency_recordings
ADD CONSTRAINT check_latitude
CHECK (location_latitude IS NULL OR (location_latitude >= -90 AND location_latitude <= 90));

ALTER TABLE emergency_recordings
ADD CONSTRAINT check_longitude
CHECK (location_longitude IS NULL OR (location_longitude >= -180 AND location_longitude <= 180));
```

### 3. Add Data Retention Policy
```sql
-- Function to delete old recordings
CREATE OR REPLACE FUNCTION delete_old_recordings()
RETURNS void AS $$
BEGIN
  DELETE FROM emergency_recordings
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-old-recordings', '0 2 * * *', 'SELECT delete_old_recordings()');
```

## Migration Steps

### Step 1: Apply RLS Policies
Run each of the policy creation statements above in your Supabase SQL editor.

### Step 2: Test Policies
```sql
-- Test as a specific user (replace with actual user ID)
SET LOCAL request.jwt.claim.sub = 'user-id-here';

SELECT * FROM emergency_recordings; -- Should only show user's recordings

INSERT INTO emergency_recordings (user_id, video_path, emergency_type, duration_seconds)
VALUES ('user-id-here', 'test.mp4', 'pulled_over', 60); -- Should succeed

-- Test that user cannot access another user's data
SELECT * FROM emergency_recordings WHERE user_id != 'user-id-here'; -- Should return empty
```

### Step 3: Monitor Access Logs
Check Supabase logs to ensure policies are working correctly:
```sql
SELECT * FROM postgres_logs
WHERE direction = 'out'
  AND error_message IS NOT NULL
ORDER BY timestamp DESC
LIMIT 10;
```

## Important Security Notes

1. **Never Disable RLS**: RLS must remain enabled at all times
2. **Test Thoroughly**: Always test policies in development before production
3. **Monitor Performance**: RLS can impact query performance - monitor and add indexes as needed
4. **Regular Audits**: Periodically review and audit access logs
5. **Backup Before Changes**: Always backup your database before applying security changes

## Troubleshooting

### Common Issues

#### Issue: Users can't see their own data
- **Solution**: Check that RLS is enabled and policies are correctly applied
- **SQL**: `SELECT * FROM pg_policies WHERE tablename = 'emergency_recordings';`

#### Issue: Performance is slow
- **Solution**: Add appropriate indexes and check query plans
- **SQL**: `EXPLAIN ANALYZE SELECT * FROM emergency_recordings WHERE user_id = 'x';`

#### Issue: Policy errors
- **Solution**: Check policy syntax and ensure `auth.uid()` is available
- **SQL**: Test with `SELECT auth.uid();` to verify authentication

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
