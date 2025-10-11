import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { LanguageService } from '../../../core/services/language.service';
import { ToastService } from '../../../core/services/toast.service';
import { QuestionSuggestionService, type ProfileForAI, type AiQuestion } from '../../../core/services/question-suggestion.service';
import { OCCUPATIONS, OTHER } from '../../../core/constants/occupations.constant';
import { LucideAngularModule, FileText, Circle, SquareCheck, Star, Calendar, Mic, Image, Mail, Phone, Paperclip } from 'lucide-angular';

type QuestionType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'single_choice' | 'multiple_choice' | 'rating' | 'audio' | 'file' | 'conditional';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  isRequired: boolean;
  placeholder?: string;
  helpText?: string;
  defaultAnswer?: string;
  minRating?: number;
  maxRating?: number;
  isFixed?: boolean;
}

export interface QuestionnaireProfile {
  businessName?: string;
  occupation?: string;
  subOccupation?: string;
  occupationFree?: string;
  subOccupationFree?: string;
  email?: string;
  mobile?: string;
  links?: { title: string; url: string }[];
}

export interface QuestionDialogData {
  questions: Question[];
  profile?: QuestionnaireProfile;
  questionnaireId?: string | null;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    brandColor?: string;
    logoUrl?: string;
    imageUrl?: string;
  };
}

@Component({
  selector: 'app-create-questionnaire-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatSelectModule, MatFormFieldModule, LucideAngularModule],
  templateUrl: './create-questionnaire-questions.component.html',
  styleUrls: ['./create-questionnaire-questions.component.sass']
})
export class CreateQuestionnaireQuestionsComponent implements OnInit {
  questions: Question[] = [];
  profile?: QuestionnaireProfile;
  questionnaireId?: string | null;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    brandColor?: string;
    logoUrl?: string;
    imageUrl?: string;
  };

  editingQuestion: Question | null = null;
  showAddDialog = false;
  showCategoryDialog = false;
  showQuickAddDialog = false;
  showSuggestQuestionDialog = false;
  selectedCategory = '';
  loadingSuggestions = false;
  loadingSingleSuggestion = false;
  questionDescription = '';

  OTHER = OTHER;

  // Icon imports for lucide-angular
  readonly FileTextIcon = FileText;
  readonly CircleIcon = Circle;
  readonly SquareCheckIcon = SquareCheck;
  readonly StarIcon = Star;
  readonly CalendarIcon = Calendar;
  readonly MicIcon = Mic;
  readonly ImageIcon = Image;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly PaperclipIcon = Paperclip;

  get questionTypes() {
    const currentLang = this.lang.currentLanguage;
    if (this._lastLanguage !== currentLang || this._questionTypes.length === 0) {
      this._lastLanguage = currentLang;
      const isHe = currentLang === 'he';
      this._questionTypes = [
        { value: 'text', label: isHe ? 'טקסט חופשי' : 'Free Text', icon: this.FileTextIcon },
        { value: 'radio', label: isHe ? 'בחירה יחידה' : 'Single Choice', icon: this.CircleIcon },
        { value: 'checkbox', label: isHe ? 'בחירה מרובה' : 'Multiple Choice', icon: this.SquareCheckIcon },
        { value: 'rating', label: isHe ? 'דירוג (1-5 כוכבים)' : 'Rating (1-5 stars)', icon: this.StarIcon },
        { value: 'audio', label: isHe ? 'הקלטה קולית' : 'Audio Recording', icon: this.MicIcon },
        { value: 'conditional', label: isHe ? 'שאלה מותנית' : 'Conditional Question', icon: this.ImageIcon },
        { value: 'email', label: isHe ? 'אימייל' : 'Email', icon: this.MailIcon },
        { value: 'phone', label: isHe ? 'טלפון' : 'Phone', icon: this.PhoneIcon },
        { value: 'file', label: isHe ? 'העלאת קובץ/מסמכים' : 'File/Document Upload', icon: this.PaperclipIcon },
      ];
    }
    return this._questionTypes;
  }

  get businessCategories() {
    const currentLang = this.lang.currentLanguage;
    if (this._lastLanguage !== currentLang || this._businessCategories.length === 0) {
      this._businessCategories = [
        { value: 'lawyer', label: this.lang.t('category.lawyer') },
        { value: 'coach', label: this.lang.t('category.coach') },
        { value: 'insurance', label: this.lang.t('category.insurance') },
        { value: 'consultant', label: this.lang.t('category.consultant') },
        { value: 'therapist', label: this.lang.t('category.therapist') },
        { value: 'accountant', label: this.lang.t('category.accountant') },
        { value: 'other', label: this.lang.t('category.other') },
      ];
    }
    return this._businessCategories;
  }

  private _questionTypes: any[] = [];
  private _businessCategories: any[] = [];
  private _lastLanguage: string = '';

  constructor(
    public lang: LanguageService,
    private toast: ToastService,
    private questionSuggestionService: QuestionSuggestionService,
    private router: Router,
    public dialogRef: MatDialogRef<CreateQuestionnaireQuestionsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuestionDialogData
  ) {
    this.questions = [...data.questions];
    this.profile = data.profile;
    this.questionnaireId = data.questionnaireId;
    this.branding = data.branding;

    // Add fixed questions at the start if they don't exist
    this.ensureFixedQuestions();
  }

  private ensureFixedQuestions() {
    const isHe = this.lang.currentLanguage === 'he';

    // Check if first 3 questions are the fixed questions (text, email, phone in that order)
    const hasFixedQuestions = this.questions.length >= 3 &&
      this.questions[0].type === 'text' &&
      this.questions[1].type === 'email' &&
      this.questions[2].type === 'phone';

    if (!hasFixedQuestions) {
      // Only add fixed questions if they don't exist at the beginning
      const fixedQuestions: Question[] = [
        {
          id: 'fixed_fullname',
          text: isHe ? 'מה שמך המלא?' : "What's your full name?",
          type: 'text',
          isRequired: true,
          isFixed: true
        },
        {
          id: 'fixed_email',
          text: isHe ? 'מה האימייל שלך?' : "What's your email?",
          type: 'email',
          isRequired: true,
          isFixed: true
        },
        {
          id: 'fixed_mobile',
          text: isHe ? 'מה מספר הנייד שלך?' : "What's your mobile number?",
          type: 'phone',
          isRequired: true,
          isFixed: true
        }
      ];

      // Add fixed questions at the beginning
      this.questions = [...fixedQuestions, ...this.questions];
    } else {
      // Mark existing first 3 questions as fixed
      this.questions[0].isFixed = true;
      this.questions[1].isFixed = true;
      this.questions[2].isFixed = true;
    }
  }

  ngOnInit() {}

  close() {
    // Validate that all non-fixed questions have text
    const invalidQuestions = this.questions.filter(q =>
      !q.isFixed &&
      !q.text?.trim()
    );

    if (invalidQuestions.length > 0) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'אנא מלא את כל השאלות לפני השמירה'
          : 'Please fill in all questions before saving',
        'error'
      );
      return;
    }

    // Validate that choice questions have at least one non-empty option
    const choiceTypes = ['radio', 'checkbox', 'single_choice', 'multiple_choice', 'select', 'conditional'];
    const questionsWithEmptyOptions = this.questions.filter(q => {
      if (choiceTypes.includes(q.type)) {
        // Check if options array exists and has at least one non-empty option
        return !q.options || q.options.length === 0 || !q.options.some(opt => {
          const optionText = typeof opt === 'string' ? opt : (opt as any).label || (opt as any).value || '';
          return optionText.trim().length > 0;
        });
      }
      return false;
    });

    if (questionsWithEmptyOptions.length > 0) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'שאלות בחירה חייבות להכיל לפחות אפשרות אחת עם טקסט'
          : 'Choice questions must have at least one option with text',
        'error'
      );
      return;
    }

    this.dialogRef.close(this.questions);
  }

  cancel() {
    this.dialogRef.close();
  }

  showPreview() {
    // Validate that all non-fixed questions have text
    const invalidQuestions = this.questions.filter(q =>
      !q.isFixed &&
      !q.text?.trim()
    );

    if (invalidQuestions.length > 0) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'אנא מלא את כל השאלות לפני התצוגה המקדימה'
          : 'Please fill in all questions before preview',
        'error'
      );
      return;
    }

    // Validate that choice questions have at least one non-empty option
    const choiceTypes = ['radio', 'checkbox', 'single_choice', 'multiple_choice', 'select', 'conditional'];
    const questionsWithEmptyOptions = this.questions.filter(q => {
      if (choiceTypes.includes(q.type)) {
        return !q.options || q.options.length === 0 || !q.options.some(opt => {
          const optionText = typeof opt === 'string' ? opt : (opt as any).label || (opt as any).value || '';
          return optionText.trim().length > 0;
        });
      }
      return false;
    });

    if (questionsWithEmptyOptions.length > 0) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'שאלות בחירה חייבות להכיל לפחות אפשרות אחת עם טקסט'
          : 'Choice questions must have at least one option with text',
        'error'
      );
      return;
    }

    // Convert questions to database format for preview
    const previewQuestions = this.questions.map((q, index) => {
      const questionText = q.text;
      return {
        id: q.id,
        question_text: questionText,
        question_type: q.type,
        is_required: q.isRequired,
        question_order: index + 1,
        order_index: index,
        min_rating: (q as any).minRating || null,
        max_rating: (q as any).maxRating || null,
        options: q.options || []
      };
    });

    // Store questionnaire preview data in session storage
    const previewData = {
      questionnaire: {
        id: this.questionnaireId || 'preview',
        title: this.profile?.businessName || 'Preview',
        description: '',
        language: this.lang.currentLanguage,
        owner_id: 'preview-user'
      },
      questions: previewQuestions,
      options: [],
      profile: {
        brand_primary: this.branding?.primaryColor || '#199f3a',
        brand_secondary: this.branding?.secondaryColor || '#9cbb54',
        background_color: this.branding?.brandColor || '#b0a0a4',
        logo_url: this.branding?.logoUrl || '',
        image_url: this.branding?.imageUrl || ''
      }
    };

    sessionStorage.setItem('preview_questionnaire', JSON.stringify(previewData));

    // Open preview in new tab
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/questionnaires/live', 'preview'])
    );
    window.open(url, '_blank');
  }

  addQuestion() {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'text',
      isRequired: true,
      defaultAnswer: ''
    };
    this.questions.push(newQuestion);
  }

  private ensureOptionsForQuestion(question: Question) {
    const typesNeedingOptions = ['select', 'radio', 'checkbox', 'conditional'];
    if (typesNeedingOptions.includes(question.type)) {
      if (!question.options || question.options.length < 2) {
        // Ensure at least 2 options exist
        const existingOptions = question.options || [];
        const neededOptions = 2 - existingOptions.length;
        question.options = [...existingOptions, ...Array(neededOptions).fill('')];
      }
    }
  }

  saveQuestion() {
    if (this.editingQuestion) {
      const index = this.questions.findIndex(q => q.id === this.editingQuestion!.id);
      if (index >= 0) {
        this.questions[index] = { ...this.editingQuestion };
        this.toast.show(this.lang.t('toast.questionUpdatedDesc'), 'success');
      } else {
        this.questions.push({ ...this.editingQuestion });
        this.toast.show(this.lang.t('toast.questionAddedDesc'), 'success');
      }
      this.showAddDialog = false;
      this.editingQuestion = null;
    }
  }

  editQuestion(question: Question) {
    // Questions are now edited inline, no need for dialog
  }

  deleteQuestion(id: string) {
    // Check if this is a fixed question
    const question = this.questions.find(q => q.id === id);
    if (question?.isFixed) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'לא ניתן למחוק שאלה קבועה'
          : 'Cannot delete fixed question',
        'error'
      );
      return;
    }

    this.questions = this.questions.filter(q => q.id !== id);
    this.toast.show(this.lang.t('toast.questionDeletedDesc'), 'success');
  }

  duplicateQuestion(index: number) {
    const original = this.questions[index];
    const duplicate: Question = {
      id: `q_${Date.now()}`,
      text: original.text,
      type: original.type,
      options: original.options ? [...original.options] : undefined,
      isRequired: original.isRequired,
      placeholder: original.placeholder,
      helpText: original.helpText,
      defaultAnswer: original.defaultAnswer
    };
    this.ensureOptionsForQuestion(duplicate);
    this.questions.splice(index + 1, 0, duplicate);
    this.toast.show(this.lang.t('toast.questionDuplicatedDesc'), 'success');
  }

  addQuestionBefore(index: number) {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'text',
      isRequired: true,
      defaultAnswer: ''
    };
    this.questions.splice(index, 0, newQuestion);
  }

  addQuestionAfter(index: number) {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'text',
      isRequired: true,
      defaultAnswer: ''
    };
    this.questions.splice(index + 1, 0, newQuestion);
  }

  moveQuestionUp(index: number) {
    if (index > 0 && !this.questions[index].isFixed && !this.questions[index - 1].isFixed) {
      const temp = this.questions[index];
      this.questions[index] = this.questions[index - 1];
      this.questions[index - 1] = temp;
    }
  }

  moveQuestionDown(index: number) {
    if (index < this.questions.length - 1 && !this.questions[index].isFixed && !this.questions[index + 1].isFixed) {
      const temp = this.questions[index];
      this.questions[index] = this.questions[index + 1];
      this.questions[index + 1] = temp;
    }
  }

  async loadAiSuggestedQuestions() {
    if (!this.profile) return;

    this.loadingSuggestions = true;
    try {
      const occupation = this.profile.occupation === OTHER ? this.profile.occupationFree : this.profile.occupation;
      const suboccupation = this.profile.subOccupation === OTHER ? this.profile.subOccupationFree : this.profile.subOccupation;

      // Build profile for AI
      const aiProfile: ProfileForAI = {
        businessName: this.profile.businessName,
        occupation: occupation,
        suboccupation: suboccupation,
        email: this.profile.email,
        phone: this.profile.mobile,
        links: (this.profile.links || []).map(link => link.url).filter(Boolean),
        extra: this.profile.occupationFree || this.profile.subOccupationFree
      };

      console.log('Profile sent to AI:', aiProfile);

      // Check if we have valid occupation data (not "אחר" or empty)
      if (!occupation || ["אחר", "other", "Other"].includes(occupation.trim())) {
        this.toast.show(this.lang.currentLanguage === 'he' ? 'אין שאלות מומלצות עבור "אחר" - אפשר להוסיף ידנית' : 'No suggested questions for "Other" - please add manually', 'info');
        this.loadingSuggestions = false;
        return;
      }

      const aiQuestions = await this.questionSuggestionService.fetchSuggestedQuestions(
        aiProfile,
        { locale: this.lang.currentLanguage as "he" | "en", minCore: 4, maxTotal: 7 }
      );

      if (aiQuestions.length > 0) {
        // Map AI questions to our Question format
        const mappedQuestions: Question[] = aiQuestions.map((q: AiQuestion) => {
          const question: Question = {
            id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: q.text,
            type: this.mapAiTypeToQuestionType(q.type),
            options: q.options,
            isRequired: q.isRequired ?? false
          };
          this.ensureOptionsForQuestion(question);
          return question;
        });

        this.questions.push(...mappedQuestions);
        const message = mappedQuestions.length === 1
          ? this.lang.t('toast.questionAddedDesc')
          : `${mappedQuestions.length} ${this.lang.t('toast.questionsAddedDesc')}`;
        this.toast.show(message, 'success');
      } else {
        this.toast.show(this.lang.currentLanguage === 'he' ? 'לא התקבלו שאלות מהשרת' : 'No questions received from server', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch AI questions:', error);
      this.toast.show(this.lang.currentLanguage === 'he' ? 'שגיאה בטעינת שאלות מוצעות' : 'Error loading suggested questions', 'error');
    } finally {
      this.loadingSuggestions = false;
    }
  }

  async addSuggestedQuestions(category: string) {
    // Fallback to predefined questions for the category dialog
    this.addPredefinedSuggestedQuestions(category);
  }

  private mapAiTypeToQuestionType(aiType: string): QuestionType {
    const typeMap: Record<string, QuestionType> = {
      'text': 'text',
      'textarea': 'textarea',
      'single_choice': 'radio',
      'multiple_choice': 'checkbox',
      'yes_no': 'radio',
      'email': 'email',
      'phone': 'phone',
      'single': 'radio',
      'multi': 'checkbox',
      'number': 'number',
      'select': 'select',
      'radio': 'radio',
      'checkbox': 'checkbox',
      'rating': 'rating',
      'audio': 'audio',
      'file': 'file',
      'conditional': 'conditional'
    };
    return typeMap[aiType] || 'text';
  }

  private addPredefinedSuggestedQuestions(category: string) {
    const suggested = this.getSuggestedQuestions(category);
    suggested.forEach(q => this.ensureOptionsForQuestion(q));
    this.questions.push(...suggested);
    this.showCategoryDialog = false;
    const message = suggested.length === 1
      ? this.lang.t('toast.questionAddedDesc')
      : `${suggested.length} ${this.lang.t('toast.questionsAddedDesc')}`;
    this.toast.show(message, 'success');
  }

  getSuggestedQuestions(category: string): Question[] {
    const lang = this.lang.currentLanguage;
    const suggestions: Record<string, Question[]> = {
      lawyer: [
        { id: `sq_${Date.now()}_1`, text: lang === 'he' ? 'מה הנושא המשפטי שבו אתה זקוק לעזרה?' : 'What legal matter do you need help with?', type: 'textarea', isRequired: true },
        { id: `sq_${Date.now()}_2`, text: lang === 'he' ? 'מה הלוח הזמנים הרצוי שלך לפתרון?' : 'What is your desired timeline?', type: 'radio', isRequired: true, options: [lang === 'he' ? 'דחוף' : 'Urgent', lang === 'he' ? 'חודש' : 'Month', lang === 'he' ? '3 חודשים' : '3 months'] },
        { id: `sq_${Date.now()}_3`, text: lang === 'he' ? 'מה התקציב שלך?' : 'What is your budget?', type: 'radio', isRequired: false, options: [lang === 'he' ? 'עד 5,000' : 'Up to 5,000', lang === 'he' ? '5,000-10,000' : '5,000-10,000', lang === 'he' ? '10,000+' : '10,000+'] }
      ],
      coach: [
        { id: `sq_${Date.now()}_1`, text: lang === 'he' ? 'מה התחום שבו תרצה לקבל ליווי?' : 'What area would you like coaching in?', type: 'radio', isRequired: true, options: [lang === 'he' ? 'קריירה' : 'Career', lang === 'he' ? 'אישי' : 'Personal', lang === 'he' ? 'עסקי' : 'Business'] },
        { id: `sq_${Date.now()}_2`, text: lang === 'he' ? 'מה המטרה הראשית שלך?' : 'What is your main goal?', type: 'textarea', isRequired: true },
        { id: `sq_${Date.now()}_3`, text: lang === 'he' ? 'איך תעדיף לקבל ליווי?' : 'Preferred coaching method?', type: 'radio', isRequired: true, options: [lang === 'he' ? 'פרונטלי' : 'In-person', lang === 'he' ? 'אונליין' : 'Online', lang === 'he' ? 'היברידי' : 'Hybrid'] }
      ],
      insurance: [
        { id: `sq_${Date.now()}_1`, text: lang === 'he' ? 'איזה סוג ביטוח מעניין אותך?' : 'What type of insurance interests you?', type: 'radio', isRequired: true, options: [lang === 'he' ? 'חיים' : 'Life', lang === 'he' ? 'בריאות' : 'Health', lang === 'he' ? 'רכוש' : 'Property'] },
        { id: `sq_${Date.now()}_2`, text: lang === 'he' ? 'מה הכיסוי הנוכחי שלך?' : 'What is your current coverage?', type: 'textarea', isRequired: false },
        { id: `sq_${Date.now()}_3`, text: lang === 'he' ? 'מה גיל המבוטח?' : 'Age of insured?', type: 'text', isRequired: true }
      ]
    };

    return suggestions[category] || [];
  }

  getQuickQuestions(): Question[] {
    const lang = this.lang.currentLanguage;
    return [
      { id: `qq_${Date.now()}_1`, text: lang === 'he' ? 'מה השם המלא שלך?' : 'What is your full name?', type: 'text', isRequired: true },
      { id: `qq_${Date.now()}_2`, text: lang === 'he' ? 'מה כתובת האימייל שלך?' : 'What is your email address?', type: 'email', isRequired: true },
      { id: `qq_${Date.now()}_3`, text: lang === 'he' ? 'מה מספר הטלפון שלך?' : 'What is your phone number?', type: 'phone', isRequired: true },
      { id: `qq_${Date.now()}_4`, text: lang === 'he' ? 'איך שמעת עלינו?' : 'How did you hear about us?', type: 'radio', isRequired: false, options: [lang === 'he' ? 'גוגל' : 'Google', lang === 'he' ? 'פייסבוק' : 'Facebook', lang === 'he' ? 'המלצה' : 'Referral'] }
    ];
  }

  addQuickQuestion(question: Question) {
    this.questions.push(question);
    this.showQuickAddDialog = false;
    this.toast.show(this.lang.t('toast.questionAddedDesc'), 'success');
  }

  addOptionToQuestion() {
    if (this.editingQuestion && (this.editingQuestion.type === 'single_choice' || this.editingQuestion.type === 'multiple_choice')) {
      if (!this.editingQuestion.options) {
        this.editingQuestion.options = [];
      }
      this.editingQuestion.options.push('');
    }
  }

  addOptionToQuestionByRef(question: Question) {
    if (!question.options) {
      question.options = [];
    }
    question.options.push('');
  }

  removeOption(index: number) {
    if (this.editingQuestion?.options) {
      this.editingQuestion.options.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  getQuestionTypeLabel(type: string): string {
    return this.questionTypes.find(t => t.value === type)?.label || type;
  }

  getQuestionTypeIcon(type: string): any {
    return this.questionTypes.find(t => t.value === type)?.icon || this.FileTextIcon;
  }

  hasRatingError(question: Question): boolean {
    if (question.type !== 'rating') return false;
    const min = question.minRating ?? 1;
    const max = question.maxRating ?? 5;

    // Check if values are within valid range (1-5)
    if (min < 1 || min > 5 || max < 1 || max > 5) return true;

    // Check if minimum is less than maximum
    return min >= max;
  }

  getRatingErrorMessage(): string {
    return this.lang.currentLanguage === 'he'
      ? 'המינימום חייב להיות בין 1-5 ונמוך מהמקסימום'
      : 'Values must be between 1-5, and minimum must be below maximum';
  }

  canDeleteQuestion(question: Question): boolean {
    return !question.isFixed;
  }

  canDeleteOption(question: Question): boolean {
    return (question.options?.length || 0) > 2;
  }

  onQuestionTypeChange(question: Question) {
    this.ensureOptionsForQuestion(question);
  }

  openSuggestQuestionDialog() {
    this.questionDescription = '';
    this.showSuggestQuestionDialog = true;
  }

  closeSuggestQuestionDialog() {
    this.showSuggestQuestionDialog = false;
    this.questionDescription = '';
  }

  async suggestSingleQuestion() {
    if (!this.questionDescription.trim()) {
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'אנא הזן תיאור לשאלה'
          : 'Please enter a question description',
        'error'
      );
      return;
    }

    this.loadingSingleSuggestion = true;
    try {
      // Build a minimal profile with the description
      const aiProfile: ProfileForAI = {
        businessName: this.profile?.businessName || '',
        occupation: this.questionDescription,
        extra: this.questionDescription
      };

      const aiQuestions = await this.questionSuggestionService.fetchSuggestedQuestions(
        aiProfile,
        { locale: this.lang.currentLanguage as "he" | "en", minCore: 1, maxTotal: 1 }
      );

      if (aiQuestions.length > 0) {
        const aiQuestion = aiQuestions[0];
        const newQuestion: Question = {
          id: `ai_${Date.now()}`,
          text: aiQuestion.text,
          type: this.mapAiTypeToQuestionType(aiQuestion.type),
          options: aiQuestion.options,
          isRequired: aiQuestion.isRequired ?? false
        };

        this.ensureOptionsForQuestion(newQuestion);
        this.questions.push(newQuestion);
        this.toast.show(this.lang.t('toast.questionAddedDesc'), 'success');
        this.closeSuggestQuestionDialog();
      } else {
        this.toast.show(
          this.lang.currentLanguage === 'he'
            ? 'לא התקבלה שאלה מהשרת'
            : 'No question received from server',
          'error'
        );
      }
    } catch (error) {
      console.error('Failed to suggest question:', error);
      this.toast.show(
        this.lang.currentLanguage === 'he'
          ? 'שגיאה בהצעת שאלה'
          : 'Error suggesting question',
        'error'
      );
    } finally {
      this.loadingSingleSuggestion = false;
    }
  }
}
