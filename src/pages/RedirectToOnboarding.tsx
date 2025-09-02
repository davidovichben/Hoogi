import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RedirectToOnboarding = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      // Redirect to the new, correct onboarding/edit path
      navigate(`/onboarding?id=${id}`, { replace: true });
    } else {
      // Fallback to the questionnaires list if the ID is missing
      navigate('/questionnaires', { replace: true });
    }
  }, [id, navigate]);

  // Render a simple loading message while redirecting
  return <div>Redirecting to the editor...</div>;
};

export default RedirectToOnboarding;
