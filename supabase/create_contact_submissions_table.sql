-- Create contact_submissions table
-- This table stores all contact form submissions with their attachments and metadata
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Form fields
  country TEXT NOT NULL,
  subject TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  url TEXT,

  -- File attachment metadata
  file_name TEXT,
  file_size BIGINT, -- in bytes
  file_type TEXT,
  file_path TEXT, -- path in storage bucket

  -- Metadata
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'responded', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Routing information
  routed_to_email TEXT, -- The email address this was routed to based on contact_rules

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status
  ON public.contact_submissions(status);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_country
  ON public.contact_submissions(country);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_subject
  ON public.contact_submissions(subject);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email
  ON public.contact_submissions(email);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at
  ON public.contact_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_assigned_to
  ON public.contact_submissions(assigned_to);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow anonymous users to insert contact submissions (public form)
CREATE POLICY "Anyone can submit contact forms"
  ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view all contact submissions
CREATE POLICY "Authenticated users can view contact submissions"
  ON public.contact_submissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users to update contact submissions
CREATE POLICY "Authenticated users can update contact submissions"
  ON public.contact_submissions
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete contact submissions
CREATE POLICY "Authenticated users can delete contact submissions"
  ON public.contact_submissions
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Automatically set responded_at when status changes to 'responded'
  IF NEW.status = 'responded' AND OLD.status != 'responded' THEN
    NEW.responded_at = NOW();
  END IF;

  -- Automatically set closed_at when status changes to 'closed'
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_submissions_updated_at ON public.contact_submissions;
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.contact_submissions IS 'Stores all contact form submissions with metadata and file attachments';
COMMENT ON COLUMN public.contact_submissions.country IS 'Country selected in the form (e.g., ישראל, USA, UK)';
COMMENT ON COLUMN public.contact_submissions.subject IS 'Subject/category of the contact request';
COMMENT ON COLUMN public.contact_submissions.name IS 'Full name of the person submitting';
COMMENT ON COLUMN public.contact_submissions.email IS 'Contact email address';
COMMENT ON COLUMN public.contact_submissions.message IS 'Main message/description of the inquiry';
COMMENT ON COLUMN public.contact_submissions.url IS 'Optional URL related to the inquiry';
COMMENT ON COLUMN public.contact_submissions.file_name IS 'Original filename of uploaded attachment';
COMMENT ON COLUMN public.contact_submissions.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.contact_submissions.file_type IS 'MIME type of the file (e.g., image/png, video/mp4)';
COMMENT ON COLUMN public.contact_submissions.file_path IS 'Path to file in Supabase storage bucket';
COMMENT ON COLUMN public.contact_submissions.status IS 'Current status: new, in_progress, responded, or closed';
COMMENT ON COLUMN public.contact_submissions.priority IS 'Priority level: low, medium, or high';
COMMENT ON COLUMN public.contact_submissions.assigned_to IS 'User ID of staff member assigned to handle this submission';
COMMENT ON COLUMN public.contact_submissions.routed_to_email IS 'Email address from contact_rules that this was routed to';

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON public.contact_submissions TO authenticated;
GRANT INSERT ON public.contact_submissions TO anon, authenticated;

-- Create storage bucket for contact form attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-attachments', 'contact-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contact attachments

-- Allow anyone to upload files (when submitting form)
CREATE POLICY "Anyone can upload contact attachments"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'contact-attachments');

-- Allow authenticated users to view attachments
CREATE POLICY "Authenticated users can view contact attachments"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'contact-attachments' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete attachments
CREATE POLICY "Authenticated users can delete contact attachments"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'contact-attachments' AND auth.role() = 'authenticated');
