import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface QuestionOption {
  id: string;
  label: string;
  order_index: number;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  is_required: boolean;
  question_order: number;
  options?: QuestionOption[];
}

interface Questionnaire {
  id: string;
  title: string;
  is_published: boolean;
  public_token?: string;
}

const QuestionnairePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // טעינת השאלון
        const { data: qData, error: qError } = await supabase
          .from('questionnaires')
          .select('id, title, is_published, public_token')
          .eq('id', id)
          .single();

        if (qError) throw qError;
        setQuestionnaire(qData);

        // טעינת השאלות
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text, question_type, is_required, question_order')
          .eq('questionnaire_id', id)
          .order('question_order', { ascending: true });

        if (questionsError) throw questionsError;

        // טעינת האפשרויות
        const questionsWithOptions = await Promise.all(
          questionsData.map(async (question) => {
            console.log(`Loading options for question: ${question.id}`);
            
            const { data: optionsData, error: optionsError } = await supabase
              .from('question_options')
              .select('id, label, order_index')
              .eq('question_id', question.id)
              .order('order_index', { ascending: true });

            if (optionsError) {
              console.error(`Error loading options for question ${question.id}:`, optionsError);
            }

            console.log(`Options for question ${question.id}:`, optionsData);

            return {
              ...question,
              options: optionsData || []
            };
          })
        );

        console.log('Final questions with options:', questionsWithOptions);
        setQuestions(questionsWithOptions);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">שגיאה</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            חזרה ללוח הבקרה
          </Link>
        </div>
      </div>
    );
  }

  if (!questionnaire) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❓</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">לא נמצא</h2>
          <p className="text-gray-600 mb-4">השאלון לא קיים</p>
          <Link to="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            חזרה ללוח הבקרה
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={`/distribute?qid=${id}`} className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">
              ← חזרה להפצה
            </Link>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                טיוטה
              </span>
              <h1 className="text-lg font-medium text-gray-900">תצוגה מקדימה</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{questionnaire.title}</h2>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">שאלות השאלון</h3>
          
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">אין שאלות</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-6">
                  {/* Question Type */}
                  <div className="mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {question.question_type === 'single_choice' && 'בחירה יחידה'}
                      {question.question_type === 'multiple_choice' && 'בחירה מרובה'}
                      {question.question_type === 'text' && 'טקסט'}
                      {question.question_type === 'number' && 'מספר'}
                      {question.question_type === 'email' && 'אימייל'}
                      {question.question_type || question.question_type}
                    </span>
                  </div>

                  {/* Question */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                      <span className="text-lg font-medium text-gray-900">שאלה {index + 1}</span>
                      {question.is_required && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          חובה
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 text-lg">{question.question_text}</p>
                  </div>

                  {/* Options */}
                  {question.options && question.options.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">אפשרויות תשובה:</p>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center space-x-3 rtl:space-x-reverse">
                            <span className="text-sm text-gray-500 min-w-[20px]">{optionIndex + 1}.</span>
                            <div className="flex-1 p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                              <span className="text-gray-800">{option.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-sm text-gray-500 text-center">
                        {question.question_type === 'single_choice' || question.question_type === 'multiple_choice' 
                          ? 'אין אפשרויות בחירה' 
                          : 'שאלה זו לא דורשת אפשרויות'
                        }
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionnairePreview;
