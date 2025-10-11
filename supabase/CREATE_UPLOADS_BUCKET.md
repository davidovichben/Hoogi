# Quick Setup: Create 'uploads' Storage Bucket

## Issue
The storage bucket name was changed from `public` (reserved) to `uploads`.

## Solution - Create the Bucket

Follow these simple steps:

### Step 1: Go to Supabase Dashboard
Open: https://supabase.com/dashboard/project/lcazbaggfdejukjgkpeu

### Step 2: Navigate to Storage
Click **"Storage"** in the left sidebar

### Step 3: Create New Bucket
Click the **"New bucket"** button

### Step 4: Configure Bucket
- **Name**: `uploads` (exactly this, lowercase)
- **Public bucket**: Toggle **ON** ✅
- **File size limit**: `10485760` (10 MB)
- Click **"Create bucket"**

### Step 5: Verify
- You should see a bucket named `uploads` in the Storage section
- Try uploading a file in your app

## That's It!

File uploads should now work in:
- Create Questionnaire page (File or Link section)
- Profile page (Logo upload)

The files will be stored in these folders:
- `logos/` - Business logos
- `questionnaire-attachments/` - Questionnaire files

## Optional: Set Up Policies (Usually Not Needed)

If you need custom permissions, you can run the SQL in:
`/home/hoogi/supabase/setup_storage_policies.sql`

But for most cases, the default policies for public buckets are sufficient.
