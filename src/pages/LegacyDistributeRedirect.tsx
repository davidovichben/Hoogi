import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function LegacyDistributeRedirect() {
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    const p = new URLSearchParams(loc.search);
    const qid = p.get('qid');
    if (qid) {
      nav(`/distribute?token=${encodeURIComponent(qid)}`, { replace: true });
    } else {
      nav('/distribute', { replace: true });
    }
  }, [loc, nav]);
  return null;
}
