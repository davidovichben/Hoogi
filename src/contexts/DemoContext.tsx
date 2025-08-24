import React, { createContext, useContext, useState } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(true);

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};

// Demo data with multilingual support
export const getDemoData = (language: 'en' | 'he') => {
  if (language === 'he') {
    return {
      questionnaires: [
        {
          id: '1',
          title: 'טופס צריכת ייעוץ משפטי',
          category: 'עורך דין',
          responses: 24,
          leads: 18,
          status: 'active'
        },
        {
          id: '2', 
          title: 'הערכת מאמן אישי',
          category: 'מאמן',
          responses: 12,
          leads: 8,
          status: 'active'
        }
      ],
      responses: [
        {
          id: '1',
          clientName: 'יוחנן כהן',
          clientEmail: 'yohanan@example.com',
          questionnaire: 'טופס צריכת ייעוץ משפטי',
          sentiment: 'positive',
          leadQuality: 'high',
          status: 'replied',
          createdAt: '15/01/2024'
        },
        {
          id: '2',
          clientName: 'שרה לוי',
          clientEmail: 'sarah@example.com', 
          questionnaire: 'הערכת מאמן אישי',
          sentiment: 'neutral',
          leadQuality: 'medium',
          status: 'pending',
          createdAt: '14/01/2024'
        },
        {
          id: '3',
          clientName: 'דוד ישראלי',
          clientEmail: 'david@example.com',
          questionnaire: 'טופס צריכת ייעוץ משפטי',
          sentiment: 'positive',
          leadQuality: 'high',
          status: 'scheduled',
          createdAt: '13/01/2024'
        }
      ],
      leads: [
        {
          id: '1',
          name: 'יוחנן כהן',
          email: 'yohanan@example.com',
          phone: '+972-50-555-0123',
          score: 85,
          status: 'new',
          source: 'questionnaire'
        },
        {
          id: '2',
          name: 'שרה לוי', 
          email: 'sarah@example.com',
          phone: '+972-50-555-0124',
          score: 72,
          status: 'contacted',
          source: 'questionnaire'
        },
        {
          id: '3',
          name: 'דוד ישראלי',
          email: 'david@example.com',
          phone: '+972-50-555-0125',
          score: 91,
          status: 'qualified',
          source: 'questionnaire'
        },
        {
          id: '4',
          name: 'רחל אברהם',
          email: 'rachel@example.com',
          phone: '+972-50-555-0126',
          score: 68,
          status: 'new',
          source: 'questionnaire'
        }
      ],
      questions: [
        {
          id: '1',
          text: 'מה השם המלא שלך?',
          type: 'text',
          required: true,
          defaultAnswer: ''
        },
        {
          id: '2',
          text: 'מה כתובת האימייל שלך?',
          type: 'email',
          required: true,
          defaultAnswer: ''
        },
        {
          id: '3',
          text: 'מה מספר הטלפון שלך?',
          type: 'phone',
          required: true,
          defaultAnswer: ''
        },
        {
          id: '4',
          text: 'באיזה תחום אתה זקוק לייעוץ משפטי?',
          type: 'select',
          required: true,
          options: ['דיני משפחה', 'דיני עבודה', 'דיני נדל"ן', 'דיני חברות', 'אחר'],
          defaultAnswer: ''
        },
        {
          id: '5',
          text: 'תאר בקצרה את הבעיה או השאלה שלך',
          type: 'textarea',
          required: false,
          defaultAnswer: ''
        }
      ],
      analytics: {
        totalLeads: 26,
        activeQuestionnaires: 2,
        responseRate: 68,
        conversionRate: 24
      }
    };
  }

  // English data
  return {
    questionnaires: [
      {
        id: '1',
        title: 'Legal Consultation Intake',
        category: 'lawyer',
        responses: 24,
        leads: 18,
        status: 'active'
      },
      {
        id: '2', 
        title: 'Coaching Assessment',
        category: 'coach',
        responses: 12,
        leads: 8,
        status: 'active'
      }
    ],
    responses: [
      {
        id: '1',
        clientName: 'John Smith',
        clientEmail: 'john@example.com',
        questionnaire: 'Legal Consultation Intake',
        sentiment: 'positive',
        leadQuality: 'high',
        status: 'replied',
        createdAt: '2024-01-15'
      },
      {
        id: '2',
        clientName: 'Sarah Cohen',
        clientEmail: 'sarah@example.com', 
        questionnaire: 'Coaching Assessment',
        sentiment: 'neutral',
        leadQuality: 'medium',
        status: 'pending',
        createdAt: '2024-01-14'
      },
      {
        id: '3',
        clientName: 'David Miller',
        clientEmail: 'david@example.com',
        questionnaire: 'Legal Consultation Intake',
        sentiment: 'positive',
        leadQuality: 'high',
        status: 'scheduled',
        createdAt: '2024-01-13'
      }
    ],
    leads: [
      {
        id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        phone: '+1-555-0123',
        score: 85,
        status: 'new',
        source: 'questionnaire'
      },
      {
        id: '2',
        name: 'Sarah Cohen', 
        email: 'sarah@example.com',
        phone: '+1-555-0124',
        score: 72,
        status: 'contacted',
        source: 'questionnaire'
      },
      {
        id: '3',
        name: 'David Miller',
        email: 'david@example.com',
        phone: '+1-555-0125',
        score: 91,
        status: 'qualified',
        source: 'questionnaire'
      },
      {
        id: '4',
        name: 'Rachel Johnson',
        email: 'rachel@example.com',
        phone: '+1-555-0126',
        score: 68,
        status: 'new',
        source: 'questionnaire'
      }
    ],
    questions: [
      {
        id: '1',
        text: 'What is your full name?',
        type: 'text',
        required: true,
        defaultAnswer: ''
      },
      {
        id: '2',
        text: 'What is your email address?',
        type: 'email',
        required: true,
        defaultAnswer: ''
      },
      {
        id: '3',
        text: 'What is your phone number?',
        type: 'phone',
        required: true,
        defaultAnswer: ''
      },
      {
        id: '4',
        text: 'What type of legal consultation do you need?',
        type: 'select',
        required: true,
        options: ['Family Law', 'Employment Law', 'Real Estate Law', 'Corporate Law', 'Other'],
        defaultAnswer: ''
      },
      {
        id: '5',
        text: 'Please briefly describe your issue or question',
        type: 'textarea',
        required: false,
        defaultAnswer: ''
      }
    ],
    analytics: {
      totalLeads: 26,
      activeQuestionnaires: 2,
      responseRate: 68,
      conversionRate: 24
    }
  };
};

// Legacy export for backward compatibility
export const demoData = getDemoData('en');