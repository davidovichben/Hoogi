export default function TemplateB({ q }: { q: any }) {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-3">
        {q?.meta?.brand_logo_url && (
          <img src={q.meta.brand_logo_url} alt="logo" className="h-10" />
        )}
      </div>
      <h1 className="text-2xl font-semibold mb-3">{q?.title}</h1>
      
      {/* הצגת השאלות הקיימות עם עיצוב מתקדם */}
      {q?.questions && q.questions.length > 0 && (
        <div className="space-y-4">
          {q.questions.map((question: any, index: number) => (
            <div key={question.id || index} className="rounded-xl border p-5 bg-white/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    שאלה {index + 1}
                  </span>
                  {question.required && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">חובה</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 capitalize">{question.type}</span>
              </div>
              
              <h3 className="font-medium mb-3 text-gray-800">{question.title}</h3>
              
              {/* הצגת סוג השאלה */}
              {question.type === 'text' && (
                <input 
                  type="text" 
                  placeholder="הקלד תשובתך כאן..." 
                  className="w-full p-3 border rounded-lg bg-white/80 backdrop-blur-sm"
                  disabled
                />
              )}
              {question.type === 'textarea' && (
                <textarea 
                  placeholder="הקלד תשובתך כאן..." 
                  className="w-full p-3 border rounded-lg bg-white/80 backdrop-blur-sm h-24 resize-none"
                  disabled
                />
              )}
              {question.type === 'select' && question.options && (
                <select className="w-full p-3 border rounded-lg bg-white/80 backdrop-blur-sm" disabled>
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
                    <label key={optIndex} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="radio" name={`q${index}`} disabled className="text-blue-600" />
                      <span className="text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {question.type === 'checkbox' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option: any, optIndex: number) => (
                    <label key={optIndex} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" disabled className="text-blue-600 rounded" />
                      <span className="text-gray-700">{option.label}</span>
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
        <div className="rounded-xl border p-5 bg-white/60 text-center text-gray-500">
          אין שאלות להצגה
        </div>
      )}
    </div>
  );
}
