import React, { useState } from 'react';
import ClientQuestionnaire from './ClientQuestionnaire';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'single_choice' | 'multiple_choice' | 'rating' | 'date' | 'audio' | 'email' | 'phone' | 'file';
  options?: string[];
  isRequired: boolean;
}

interface PreviewPanelProps {
  formData: {
    title: string;
    description?: string;
    brandColor?: string;
    logoUrl?: string;
    questions: Question[];
  };
  onBackToEdit: () => void;
}

export default function PreviewPanel({ formData, onBackToEdit }: PreviewPanelProps) {
  const [mode, setMode] = useState<'form' | 'chat'>('form');

  const handleSubmit = (answers: any) => {
    console.log('Preview answers:', answers);
    // כאן תהיה שמירה אמיתית של התשובות
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">תצוגה מקדימה</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('form')}
              className={`px-4 py-2 rounded-md transition-colors ${
                mode === 'form' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              כתופס
            </button>
            <button
              onClick={() => setMode('chat')}
              className={`px-4 py-2 rounded-md transition-colors ${
                mode === 'chat' 
                  ? 'bg-white shadow-sm text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              כצ׳אט
            </button>
          </div>
        </div>
        
        <button
          onClick={onBackToEdit}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          חזרה לעריכה
        </button>
      </div>

      {/* Preview content */}
      <div className="bg-white rounded-lg shadow-sm border">
        <ClientQuestionnaire
          mode={mode}
          data={formData}
          rtl={true}
          enableUploads={false} // בפריוויו – לא מעלים ל-Storage
          onSubmit={handleSubmit}
        />
      </div>

      {/* Info box */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="text-blue-500 mt-0.5">ℹ️</div>
          <div className="text-sm text-blue-700">
            <strong>מצב תצוגה מקדימה:</strong> כאן תוכל לראות איך השאלון ייראה למשתמשים הסופיים. 
            העלאת קבצים בפריוויו היא מקומית בלבד ולא נשמרת בשרת.
          </div>
        </div>
      </div>
    </div>
  );
}
