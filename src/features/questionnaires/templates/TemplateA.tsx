export default function TemplateA({ q }: { q: any }) {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{q?.title}</h1>
      <p className="opacity-70 mb-4">{q?.language?.toUpperCase()}</p>
      
      {/* הצגת השאלות הקיימות */}
      {q?.questions && q.questions.length > 0 && (
        <div className="space-y-4">
          {q.questions.map((question: any, index: number) => (
            <div key={question.id || index} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600">שאלה {index + 1}</span>
                {question.required && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">חובה</span>
                )}
              </div>
              <h3 className="font-medium mb-2">{question.title}</h3>
              
              {/* הצגת סוג השאלה */}
              {question.type === 'text' && (
                <input 
                  type="text" 
                  placeholder="הקלד תשובתך כאן..." 
                  className="w-full p-2 border rounded"
                  disabled
                />
              )}
              {question.type === 'textarea' && (
                <textarea 
                  placeholder="הקלד תשובתך כאן..." 
                  className="w-full p-2 border rounded h-20"
                  disabled
                />
              )}
              {question.type === 'select' && question.options && (
                <select className="w-full p-2 border rounded" disabled>
                  <option>בחר תשובה...</option>
                  {question.options.map((option: any, optIndex: number) => (
                    <option key={optIndex} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {question.type === 'radio' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option: any, optIndex: number) => (
                    <label key={optIndex} className="flex items-center gap-2">
                      <input type="radio" name={`q${index}`} disabled />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {question.type === 'checkbox' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option: any, optIndex: number) => (
                    <label key={optIndex} className="flex items-center gap-2">
                      <input type="checkbox" disabled />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* אם אין שאלות - הצג הודעה */}
      {(!q?.questions || q.questions.length === 0) && (
        <div className="rounded-lg border p-4 text-center text-gray-500">
          אין שאלות להצגה
        </div>
      )}
    </div>
  );
}
