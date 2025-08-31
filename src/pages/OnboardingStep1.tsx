import React from 'react';
import { Button } from '@/components/ui/button';

interface OnboardingStep1Props {
  onCreated: (id: string) => void;
}

const OnboardingStep1: React.FC<OnboardingStep1Props> = ({ onCreated }) => {
  // Mock function to simulate creating a questionnaire
  const handleCreate = () => {
    const newId = Math.random().toString(36).substring(7);
    onCreated(newId);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Step 1: Create Questionnaire</h2>
      <p className="mb-4">Click the button to create a new questionnaire.</p>
      <Button onClick={handleCreate}>Create and Proceed to Step 2</Button>
    </div>
  );
};

export default OnboardingStep1;
