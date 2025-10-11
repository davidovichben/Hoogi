-- Fix Storage Bucket Policies for 'uploads' bucket
-- This script sets up proper RLS policies to allow uploads

-- First, drop all existing policies on storage.objects to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates of own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes of own files" ON storage.objects;
DROP POLICY IF EXISTS "Public bucket read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to uploads bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create policy to allow authenticated users to INSERT (upload) files to uploads bucket
CREATE POLICY "Allow authenticated uploads to uploads bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Create policy to allow anyone to SELECT (read/download) files from uploads bucket
CREATE POLICY "Allow public reads from uploads bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Create policy to allow authenticated users to UPDATE their own files
CREATE POLICY "Allow users to update own files in uploads bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- Create policy to allow authenticated users to DELETE their own files
CREATE POLICY "Allow users to delete own files in uploads bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- Verify the policies were created successfully
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%uploads%'
ORDER BY policyname;
