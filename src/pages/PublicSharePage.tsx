import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { fetchPublicQuestionnaireByToken } from '@/services/questionnaires';
import TemplateA from '@/features/questionnaires/templates/TemplateA';
import TemplateB from '@/features/questionnaires/templates/TemplateB';

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [q, setQ] = useState<any>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!token) return;
      try {
        const data = await fetchPublicQuestionnaireByToken(token);
        if (!cancel) setQ(data);
      } catch {
        if (!cancel) setQ(null);
      }
    })();
    return () => { cancel = true; };
  }, [token]);

  if (!q) return null; // או ספינר קיים

  // בחירת תבנית לפי meta (ברירת מחדל A)
  const tpl = q?.meta?.template === 'B' ? <TemplateB q={q} /> : <TemplateA q={q} />;
  return tpl;
}
