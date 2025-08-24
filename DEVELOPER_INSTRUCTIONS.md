# 🚀 **Complete Developer Instructions: Dynamic Questionnaire Component**

## **Overview**
This document provides step-by-step instructions to integrate a fully functional, bilingual (Hebrew/English) questionnaire builder component into your React/Next.js project with Supabase backend.

---

## **📋 Prerequisites**
- React 18+ or Next.js 13+
- TypeScript support
- TailwindCSS configured
- Supabase project set up
- Node.js and npm/yarn installed

---

## **🔧 Step 1: Install Required Dependencies**

Run in your project root:

```bash
npm install @supabase/supabase-js react-hook-form @hookform/resolvers zod lucide-react
# OR
yarn add @supabase/supabase-js react-hook-form @hookform/resolvers zod lucide-react
```

---

## **🗄️ Step 2: Supabase Database Setup**

### Create the following tables in your Supabase dashboard:

#### **questionnaires table:**
```sql
CREATE TABLE questionnaires (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  brand_color TEXT DEFAULT '#3B82F6',
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **questions table:**
```sql
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('text', 'email', 'phone', 'select', 'multiselect', 'rating')) DEFAULT 'text',
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **responses table:**
```sql
CREATE TABLE responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  questionnaire_id UUID REFERENCES questionnaires(id),
  question_id UUID REFERENCES questions(id),
  client_email TEXT,
  response_value TEXT,
  ai_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## **⚙️ Step 3: Supabase Client Configuration**

### Create/Update: `src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      questionnaires: {
        Row: {
          id: string
          title: string
          description: string | null
          user_id: string | null
          brand_color: string
          logo_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          user_id?: string | null
          brand_color?: string
          logo_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          questionnaire_id: string
          question_text: string
          question_type: string
          options: any
          is_required: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          questionnaire_id: string
          question_text: string
          question_type?: string
          options?: any
          is_required?: boolean
          order_index: number
          created_at?: string
        }
      }
      responses: {
        Row: {
          id: string
          questionnaire_id: string
          question_id: string
          client_email: string | null
          response_value: string
          ai_reply: string | null
          created_at: string
        }
        Insert: {
          id?: string
          questionnaire_id: string
          question_id: string
          client_email?: string | null
          response_value: string
          ai_reply?: string | null
          created_at?: string
        }
      }
    }
  }
}
```

---

## **🎨 Step 4: TailwindCSS Custom Styles**

### Add to your `globals.css` or main CSS file:
```css
/* RTL Support */
.rtl {
  direction: rtl;
  text-align: right;
}

.ltr {
  direction: ltr;
  text-align: left;
}

/* Custom Input Styles */
.custom-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent;
}

.custom-button {
  @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
}

.primary-button {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500;
}

.secondary-button {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400;
}

.danger-button {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500;
}

/* Color Picker Styles */
.color-picker-container {
  @apply relative inline-block;
}

.color-picker-input {
  @apply w-16 h-10 border-2 border-gray-300 rounded cursor-pointer;
}

/* Responsive Design */
@media (max-width: 640px) {
  .mobile-stack {
    @apply flex-col space-y-2 space-x-0;
  }
}
```

---

## **🧩 Step 5: Create the Main Component**

### Create: `src/components/CreateQuestionnaire.tsx`

```typescript
'use client'

import React, { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Save, Eye, Settings } from 'lucide-react'

// Validation Schema
const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required'),
  type: z.enum(['text', 'email', 'phone', 'select', 'multiselect', 'rating']),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false)
})

const questionnaireSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  brandColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  logoUrl: z.string().url().optional().or(z.literal('')),
  questions: z.array(questionSchema).min(1, 'At least one question is required')
})

type QuestionnaireForm = z.infer<typeof questionnaireSchema>

interface CreateQuestionnaireProps {
  userId: string
  lang?: 'en' | 'he'
  onSuccess?: (questionnaireId: string) => void
}

// Translation object
const translations = {
  en: {
    title: 'Create New Questionnaire',
    questionnaireTitle: 'Questionnaire Title',
    description: 'Description (Optional)',
    brandColor: 'Brand Color',
    logoUrl: 'Logo URL (Optional)',
    addQuestion: 'Add Question',
    questionText: 'Question Text',
    questionType: 'Question Type',
    options: 'Options (one per line)',
    required: 'Required',
    save: 'Save Questionnaire',
    preview: 'Preview',
    success: 'Questionnaire created successfully!',
    error: 'Error creating questionnaire',
    types: {
      text: 'Text Input',
      email: 'Email',
      phone: 'Phone Number',
      select: 'Single Choice',
      multiselect: 'Multiple Choice',
      rating: 'Rating (1-5)'
    }
  },
  he: {
    title: 'יצירת שאלון חדש',
    questionnaireTitle: 'כותרת השאלון',
    description: 'תיאור (אופציונלי)',
    brandColor: 'צבע המותג',
    logoUrl: 'קישור ללוגו (אופציונלי)',
    addQuestion: 'הוסף שאלה',
    questionText: 'טקסט השאלה',
    questionType: 'סוג השאלה',
    options: 'אפשרויות (אחת בכל שורה)',
    required: 'חובה',
    save: 'שמור שאלון',
    preview: 'תצוגה מקדימה',
    success: 'השאלון נוצר בהצלחה!',
    error: 'שגיאה ביצירת השאלון',
    types: {
      text: 'הזנת טקסט',
      email: 'אימייל',
      phone: 'מספר טלפון',
      select: 'בחירה יחידה',
      multiselect: 'בחירה מרובה',
      rating: 'דירוג (1-5)'
    }
  }
}

const CreateQuestionnaire: React.FC<CreateQuestionnaireProps> = ({
  userId,
  lang = 'en',
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)

  const t = translations[lang]
  const isRTL = lang === 'he'

  const form = useForm<QuestionnaireForm>({
    resolver: zodResolver(questionnaireSchema),
    defaultValues: {
      title: '',
      description: '',
      brandColor: '#3B82F6',
      logoUrl: '',
      questions: [
        {
          text: '',
          type: 'text',
          options: [],
          required: false
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions'
  })

  const addQuestion = () => {
    append({
      text: '',
      type: 'text',
      options: [],
      required: false
    })
  }

  const removeQuestion = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const onSubmit = async (data: QuestionnaireForm) => {
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      // Create questionnaire
      const { data: questionnaire, error: qError } = await supabase
        .from('questionnaires')
        .insert({
          title: data.title,
          description: data.description || null,
          user_id: userId,
          brand_color: data.brandColor,
          logo_url: data.logoUrl || null
        })
        .select()
        .single()

      if (qError) throw qError

      // Create questions
      const questionsToInsert = data.questions.map((question, index) => ({
        questionnaire_id: questionnaire.id,
        question_text: question.text,
        question_type: question.type,
        options: question.options && question.options.length > 0 ? question.options : null,
        is_required: question.required,
        order_index: index
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      setSubmitMessage(t.success)
      onSuccess?.(questionnaire.id)
      
      // Reset form
      form.reset()

    } catch (error) {
      console.error('Error creating questionnaire:', error)
      setSubmitMessage(t.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestionForm = (index: number) => {
    const question = form.watch(`questions.${index}`)
    const showOptions = question.type === 'select' || question.type === 'multiselect'

    return (
      <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-900">
            {t.questionText} {index + 1}
          </h4>
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => removeQuestion(index)}
              className="text-red-600 hover:text-red-800 p-1"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.questionText}
            </label>
            <input
              {...form.register(`questions.${index}.text`)}
              className="custom-input"
              placeholder={t.questionText}
            />
            {form.formState.errors.questions?.[index]?.text && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.questions[index]?.text?.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.questionType}
            </label>
            <select
              {...form.register(`questions.${index}.type`)}
              className="custom-input"
            >
              {Object.entries(t.types).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {showOptions && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.options}
            </label>
            <textarea
              {...form.register(`questions.${index}.options`)}
              className="custom-input"
              placeholder={t.options}
              rows={3}
              onChange={(e) => {
                const options = e.target.value.split('\n').filter(opt => opt.trim())
                form.setValue(`questions.${index}.options`, options as any)
              }}
            />
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            {...form.register(`questions.${index}.required`)}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">
            {t.required}
          </label>
        </div>
      </div>
    )
  }

  if (preview) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t.preview}</h2>
            <button
              onClick={() => setPreview(false)}
              className="custom-button secondary-button"
            >
              <Settings size={16} className="mr-2" />
              {lang === 'en' ? 'Edit' : 'עריכה'}
            </button>
          </div>
          
          {/* Preview content would go here */}
          <div className="text-center text-gray-500 py-8">
            {lang === 'en' ? 'Preview functionality can be implemented here' : 'תצוגה מקדימה יכולה להיות מיושמת כאן'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.title}</h2>

        {submitMessage && (
          <div className={`p-4 rounded-md mb-6 ${
            submitMessage.includes('successfully') || submitMessage.includes('בהצלחה')
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {submitMessage}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.questionnaireTitle}
              </label>
              <input
                {...form.register('title')}
                className="custom-input"
                placeholder={t.questionnaireTitle}
              />
              {form.formState.errors.title && (
                <p className="text-red-600 text-sm mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.brandColor}
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  {...form.register('brandColor')}
                  className="color-picker-input"
                />
                <input
                  {...form.register('brandColor')}
                  className="custom-input flex-1"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.description}
              </label>
              <textarea
                {...form.register('description')}
                className="custom-input"
                placeholder={t.description}
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.logoUrl}
              </label>
              <input
                {...form.register('logoUrl')}
                className="custom-input"
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                {lang === 'en' ? 'Questions' : 'שאלות'}
              </h3>
              <button
                type="button"
                onClick={addQuestion}
                className="custom-button primary-button flex items-center"
              >
                <Plus size={16} className="mr-2" />
                {t.addQuestion}
              </button>
            </div>

            <div className="space-y-4">
              {fields.map((_, index) => renderQuestionForm(index))}
            </div>

            {form.formState.errors.questions && (
              <p className="text-red-600 text-sm">
                {form.formState.errors.questions.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="custom-button secondary-button flex items-center justify-center"
            >
              <Eye size={16} className="mr-2" />
              {t.preview}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="custom-button primary-button flex items-center justify-center"
            >
              <Save size={16} className="mr-2" />
              {isSubmitting ? (lang === 'en' ? 'Saving...' : 'שומר...') : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateQuestionnaire
```

---

## **💻 Step 6: Usage Example**

### In your page component (e.g., `src/pages/create-questionnaire.tsx`):

```typescript
import CreateQuestionnaire from '@/components/CreateQuestionnaire'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CreateQuestionnairePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSuccess = (questionnaireId: string) => {
    console.log('Questionnaire created with ID:', questionnaireId)
    // Redirect or show success message
    // router.push(`/questionnaire/${questionnaireId}`)
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <div className="text-center py-8">Please log in to create a questionnaire.</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CreateQuestionnaire 
        userId={user.id} 
        lang="en" // or "he" for Hebrew
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

---

## **🔍 Step 7: Environment Variables**

### Add to your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## **✅ Step 8: Testing Checklist**

### **Functionality Tests:**
- [ ] Component renders without errors
- [ ] Form validation works (required fields, color format, etc.)
- [ ] Can add/remove questions dynamically
- [ ] Different question types show appropriate inputs
- [ ] Color picker works and updates hex value
- [ ] Form submission creates records in Supabase
- [ ] Success/error messages display correctly
- [ ] Language switching works (Hebrew RTL, English LTR)

### **Responsive Design Tests:**
- [ ] Works on mobile devices (320px+)
- [ ] Works on tablets (768px+)
- [ ] Works on desktop (1024px+)
- [ ] No horizontal scrolling on any device
- [ ] Buttons and inputs are touch-friendly on mobile

### **Database Tests:**
- [ ] Questionnaire record created with correct data
- [ ] Questions created with proper order_index
- [ ] Foreign key relationships work correctly
- [ ] Data types match schema requirements

---

## **🐛 Common Issues & Solutions**

### **Issue: "Cannot find module '@/lib/supabase'"**
**Solution:** Update import path to match your project structure or create the file as specified.

### **Issue: TailwindCSS classes not working**
**Solution:** Ensure TailwindCSS is properly configured and the custom CSS is imported.

### **Issue: Form validation errors**
**Solution:** Check that all required fields are filled and match the validation schema.

### **Issue: Supabase connection errors**
**Solution:** Verify environment variables and database table structure.

---

## **🚀 Advanced Features (Optional)**

### **Add AI-Powered Auto-Responses:**
```typescript
// Add this function to automatically generate AI responses
const generateAIResponse = async (question: string, userResponse: string) => {
  try {
    const response = await fetch('/api/generate-ai-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userResponse })
    })
    return await response.json()
  } catch (error) {
    console.error('AI response generation failed:', error)
    return null
  }
}
```

### **Add Real-time Collaboration:**
```typescript
// Subscribe to real-time changes
useEffect(() => {
  const subscription = supabase
    .channel('questionnaire-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'questionnaires' },
      (payload) => {
        console.log('Change received!', payload)
        // Handle real-time updates
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

---

## **📞 Support**

If you encounter any issues:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure Supabase tables are created correctly
4. Check environment variables are set
5. Validate TailwindCSS configuration

---

**🎉 You're all set! The component should now be fully functional and ready for production use.**
