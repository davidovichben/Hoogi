-- טבלת משימות אוטומציה לסופרבייס
-- הרץ את הקוד הזה ב-SQL Editor בסופרבייס

-- צור טבלת automation_tasks אם לא קיימת
CREATE TABLE IF NOT EXISTS public.automation_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('email_reply', 'whatsapp_reply', 'analysis', 'notification')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'error')),
  payload JSONB DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוסף אינדקסים לביצועים טובים יותר
CREATE INDEX IF NOT EXISTS idx_automation_tasks_status 
  ON public.automation_tasks(status);

CREATE INDEX IF NOT EXISTS idx_automation_tasks_scheduled 
  ON public.automation_tasks(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_automation_tasks_type 
  ON public.automation_tasks(type);

-- הוסף RLS
ALTER TABLE public.automation_tasks ENABLE ROW LEVEL SECURITY;

-- מדיניות RLS - רק בעלי שאלונים יכולים לראות משימות שלהם
CREATE POLICY "Automation tasks are viewable by questionnaire owners" ON public.automation_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.responses r
      JOIN public.questionnaires q ON r.questionnaire_id = q.id
      WHERE r.id = (automation_tasks.payload->>'response_id')::UUID
      AND COALESCE(q.owner_id, q.user_id) = auth.uid()
    )
  );

-- מדיניות RLS - רק בעלי שאלונים יכולים ליצור משימות
CREATE POLICY "Automation tasks are insertable by questionnaire owners" ON public.automation_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.responses r
      JOIN public.questionnaires q ON r.questionnaire_id = q.id
      WHERE r.id = (automation_tasks.payload->>'response_id')::UUID
      AND COALESCE(q.owner_id, q.user_id) = auth.uid()
    )
  );

-- מדיניות RLS - רק בעלי שאלונים יכולים לעדכן משימות
CREATE POLICY "Automation tasks are updatable by questionnaire owners" ON public.automation_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.responses r
      JOIN public.questionnaires q ON r.questionnaire_id = q.id
      WHERE r.id = (automation_tasks.payload->>'response_id')::UUID
      AND COALESCE(q.owner_id, q.user_id) = auth.uid()
    )
  );

-- צור פונקציה לעדכון updated_at
CREATE OR REPLACE FUNCTION update_automation_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- צור טריגר לעדכון אוטומטי של updated_at
DROP TRIGGER IF EXISTS update_automation_tasks_updated_at ON public.automation_tasks;
CREATE TRIGGER update_automation_tasks_updated_at 
    BEFORE UPDATE ON public.automation_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_automation_tasks_updated_at();

-- הוסף פונקציה לניקוי משימות ישנות
CREATE OR REPLACE FUNCTION cleanup_old_automation_tasks()
RETURNS void AS $$
BEGIN
    DELETE FROM public.automation_tasks 
    WHERE status IN ('done', 'error') 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- צור cron job לניקוי אוטומטי (אופציונלי - דורש pg_cron extension)
-- SELECT cron.schedule('cleanup-automation-tasks', '0 2 * * *', 'SELECT cleanup_old_automation_tasks();');

-- הוסף פונקציה לספירת משימות לפי סטטוס
CREATE OR REPLACE FUNCTION get_automation_tasks_stats(questionnaire_id UUID)
RETURNS TABLE(
  total_tasks BIGINT,
  queued_tasks BIGINT,
  processing_tasks BIGINT,
  completed_tasks BIGINT,
  failed_tasks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_tasks,
        COUNT(*) FILTER (WHERE status = 'queued')::BIGINT as queued_tasks,
        COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_tasks,
        COUNT(*) FILTER (WHERE status = 'done')::BIGINT as completed_tasks,
        COUNT(*) FILTER (WHERE status = 'error')::BIGINT as failed_tasks
    FROM public.automation_tasks at
    JOIN public.responses r ON r.id = (at.payload->>'response_id')::UUID
    WHERE r.questionnaire_id = get_automation_tasks_stats.questionnaire_id;
END;
$$ language 'plpgsql';

-- הוסף הרשאות
GRANT SELECT, INSERT, UPDATE ON public.automation_tasks TO authenticated;
GRANT USAGE ON SEQUENCE automation_tasks_id_seq TO authenticated;

-- סיום - טבלת automation_tasks מוכנה לשימוש!
