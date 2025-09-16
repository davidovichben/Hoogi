import React, { useState } from 'react';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'single_choice' | 'multiple_choice' | 'rating' | 'date' | 'audio' | 'email' | 'phone' | 'file';
  options?: string[];
  isRequired: boolean;
}

interface ClientQuestionnaireProps {
  mode: 'form' | 'chat';
  data: {
    title: string;
    description?: string;
    questions: Question[];
  };
  rtl?: boolean;
  enableUploads?: boolean;
  onSubmit: (answers: any) => void;
}

export default function ClientQuestionnaire({
  mode,
  data,
  rtl = false,
  enableUploads = false,
  onSubmit
}: ClientQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleFileUpload = async (questionId: string, files: FileList | null) => {
    if (!files || !enableUploads) {
      // בפריוויו - רק שמירה מקומית
      handleAnswerChange(questionId, Array.from(files || []));
      return;
    }

    // כאן תהיה העלאה אמיתית ל-Storage
    try {
      const uploadedFiles = [];
      for (const file of Array.from(files)) {
        // כאן תהיה קריאה ל-API להעלאת הקובץ
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file) // זמני לפריוויו
        });
      }
      handleAnswerChange(questionId, uploadedFiles);
    } catch (error) {
      console.error('File upload error:', error);
    }
  };

  const QuestionField = ({ question }: { question: Question }) => {
    const value = answers[question.id];

    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="הקלד תשובה..."
          />
        );

      case 'single_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input
                  type="checkbox"
                  value={option}
                  checked={value?.includes(option) || false}
                  onChange={(e) => {
                    const current = value || [];
                    if (e.target.checked) {
                      handleAnswerChange(question.id, [...current, option]);
                    } else {
                      handleAnswerChange(question.id, current.filter((v: string) => v !== option));
                    }
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.mp3,.wav"
              onChange={(e) => handleFileUpload(question.id, e.target.files)}
              className="w-full p-2 border rounded-md"
            />
            {value && (
              <div className="text-sm text-gray-600">
                {Array.isArray(value) ? `${value.length} קבצים נבחרו` : 'קובץ נבחר'}
              </div>
            )}
          </div>
        );

      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="example@email.com"
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="050-1234567"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        );

      case 'rating':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleAnswerChange(question.id, star)}
                className={`text-2xl ${value >= star ? 'text-yellow-400' : 'text-gray-300'}`}
              >
                ⭐
              </button>
            ))}
          </div>
        );

      default:
        return <div>סוג שאלה לא נתמך: {question.type}</div>;
    }
  };

  if (mode === 'chat') {
    return (
      <div className="max-w-2xl mx-auto p-4" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="space-y-4">
          {data.questions.map((question, index) => (
            <div key={question.id} className="border rounded-lg p-4">
              <div className="font-medium mb-2">
                {index + 1}. {question.text}
                {question.isRequired && <span className="text-red-500 ml-1">*</span>}
              </div>
              <QuestionField question={question} />
              {question.type === 'file' && answers[question.id] && (
                <div className="mt-2 text-sm text-gray-600">
                  קבצים: {Array.isArray(answers[question.id]) ? answers[question.id].length : 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Form mode
  return (
    <div className="max-w-2xl mx-auto p-4" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{data.title}</h1>
          {data.description && (
            <p className="text-gray-600">{data.description}</p>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(answers); }}>
          <div className="space-y-4">
            {data.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4">
                <label className="block font-medium mb-2">
                  {question.text}
                  {question.isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                <QuestionField question={question} />
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              שלח תשובות
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
