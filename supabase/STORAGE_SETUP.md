# Supabase Storage Setup

## Creating the Storage Bucket

The application requires a storage bucket named `uploads` for file uploads. Follow these steps to create it:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://lcazbaggfdejukjgkpeu.supabase.co
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"** or **"New Bucket"**
4. Enter the following settings:
   - **Name**: `uploads`
   - **Public bucket**: ✅ Enabled (toggle ON)
   - **File size limit**: 10 MB (10485760 bytes)
   - **Allowed MIME types**: Leave empty or add specific types if needed
5. Click **"Create bucket"**

### Option 2: Via Supabase SQL Editor

Run this SQL in your Supabase SQL Editor:

```sql
-- Note: Storage buckets are typically created via the dashboard or storage API
-- This is a reference for bucket policies after the bucket is created

-- Create storage policy to allow uploads (authenticated users only)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Create storage policy to allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Create storage policy to allow users to update their own files
CREATE POLICY "Allow authenticated updates of own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy to allow users to delete their own files
CREATE POLICY "Allow authenticated deletes of own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Folder Structure

The bucket should contain these folders:
- `logos/` - For business logos
- `questionnaire-attachments/` - For questionnaire file attachments

These folders will be created automatically when the first file is uploaded to each location.

## Verifying the Setup

After creating the bucket, verify it works by:
1. Going to your Angular app
2. Navigate to Create Questionnaire
3. Try uploading a file in the "File or Link" section
4. The upload should succeed and show the file name

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created a bucket named exactly `uploads` (lowercase)
- Verify the bucket exists in Storage > Buckets

### Error: "Permission denied" or "Unauthorized"
- Make sure "Public bucket" is enabled in bucket settings
- Check that RLS policies allow authenticated users to upload

### Error: "File too large"
- Check the file size limit in bucket settings
- Default limit is 10 MB

## Storage Policies

If you need to adjust permissions, you can modify the storage policies:

```sql
-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'objects';

-- Delete a policy (if needed)
DROP POLICY IF EXISTS "policy_name" ON storage.objects;
```

## Additional Configuration

For production, consider:
- Reducing file size limits if needed
- Adding specific MIME type restrictions
- Implementing virus scanning for uploaded files
- Adding CDN for faster file delivery
