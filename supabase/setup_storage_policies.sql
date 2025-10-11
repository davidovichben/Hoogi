-- Supabase Storage Policies for 'uploads' bucket
-- Run this after creating the 'uploads' storage bucket via the dashboard

-- Clean up existing policies (if any)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates of own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes of own files" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to uploads bucket" ON storage.objects;

-- Allow authenticated users to upload files to the uploads bucket
CREATE POLICY "Authenticated users can upload to uploads bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Allow anyone to read files from the uploads bucket
CREATE POLICY "Public bucket read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Verify policies were created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
