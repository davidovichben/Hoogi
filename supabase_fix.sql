-- Fix for missing question_options column issue
-- Run this in your Supabase SQL editor

-- 1. First, let's check if the question_options table exists
-- If it doesn't exist, create it
CREATE TABLE IF NOT EXISTS question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_question_options_order ON question_options(order_index);

-- 3. Add RLS (Row Level Security) policies if you're using them
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy that allows users to see options for questions they own
CREATE POLICY "Users can view question options for their own questions" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN questionnaires qu ON q.questionnaire_id = qu.id
      WHERE q.id = question_options.question_id
      AND qu.user_id = auth.uid()
    )
  );

-- 5. Create a policy that allows users to insert options for their own questions
CREATE POLICY "Users can insert question options for their own questions" ON question_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN questionnaires qu ON q.questionnaire_id = qu.id
      WHERE q.id = question_options.question_id
      AND qu.user_id = auth.uid()
    )
  );

-- 6. Create a policy that allows users to update options for their own questions
CREATE POLICY "Users can update question options for their own questions" ON question_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN questionnaires qu ON q.questionnaire_id = qu.id
      WHERE q.id = question_options.question_id
      AND qu.user_id = auth.uid()
    )
  );

-- 7. Create a policy that allows users to delete options for their own questions
CREATE POLICY "Users can delete question options for their own questions" ON question_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN questionnaires qu ON q.questionnaire_id = qu.id
      WHERE q.id = question_options.question_id
      AND qu.user_id = auth.uid()
    )
  );

-- 8. If you want to add a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_question_options_updated_at 
  BEFORE UPDATE ON question_options 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Optional: Add some sample data if you want to test
-- INSERT INTO question_options (question_id, value, label, order_index) VALUES
--   ('your-question-id-here', 'yes', 'כן', 1),
--   ('your-question-id-here', 'no', 'לא', 2);

-- 10. Verify the table was created correctly
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'question_options'
ORDER BY ordinal_position;
