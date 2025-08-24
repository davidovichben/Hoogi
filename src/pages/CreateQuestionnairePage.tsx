import React, { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import CreateQuestionnaire from '@/components/CreateQuestionnaire'
import { useNavigate } from 'react-router-dom'

const CreateQuestionnairePage: React.FC = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSuccess = (questionnaireId: string) => {
    console.log('Questionnaire created with ID:', questionnaireId)
    // Redirect to questionnaires list or specific questionnaire
    navigate('/questionnaires')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            נדרש להתחבר למערכת
          </h2>
          <p className="text-gray-600 mb-6">
            כדי ליצור שאלון חדש יש להתחבר לחשבון.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-colors"
          >
            מעבר למסך התחברות
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CreateQuestionnaire 
        userId={user.id} 
        lang="he" // Change to "en" for English
        onSuccess={handleSuccess}
      />
    </div>
  )
}

export default CreateQuestionnairePage
