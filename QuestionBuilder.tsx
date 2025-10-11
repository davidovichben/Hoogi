import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GripVertical, Trash2, Copy, Mail, Phone, Calendar, Star, Mic, Image as ImageIcon, FileText, CheckSquare, Circle, Paperclip } from "lucide-react";
import { useState } from "react";

export interface Question {
  id: string;
  order: number;
  title: string;
  type: QuestionType;
  required: boolean;
  options?: string[]; // For single-choice and multiple-choice
  minRating?: number; // For rating
  maxRating?: number; // For rating
  placeholder?: string; // For text, email, phone
}

export type QuestionType = 
  | "text" 
  | "single-choice" 
  | "multiple-choice" 
  | "rating" 
  | "date" 
  | "voice" 
  | "conditional" 
  | "email" 
  | "phone"
  | "file-upload"
  | "calendar-integration";

interface QuestionBuilderProps {
  onSave: (questions: Question[]) => void;
  onCancel: () => void;
}

const questionTypeOptions = [
  { value: "text", label: "טקסט חופשי", icon: FileText },
  { value: "single-choice", label: "בחירה יחידה", icon: Circle },
  { value: "multiple-choice", label: "בחירה מרובה", icon: CheckSquare },
  { value: "rating", label: "דירוג (1-5 כוכבים)", icon: Star },
  { value: "date", label: "תאריך", icon: Calendar },
  { value: "voice", label: "הקלטה קולית", icon: Mic },
  { value: "conditional", label: "שאלה מותנית", icon: ImageIcon },
  { value: "email", label: "אימייל", icon: Mail },
  { value: "phone", label: "טלפון", icon: Phone },
  { value: "file-upload", label: "העלאת קובץ/מסמכים", icon: Paperclip },
  { value: "calendar-integration", label: "התחברות ליומן", icon: Calendar },
];

const QuestionBuilder = ({ onSave, onCancel }: QuestionBuilderProps) => {
  const [questions, setQuestions] = useState<Question[]>([
    { id: "1", order: 1, title: "", type: "text", required: false, options: [], placeholder: "" }
  ]);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      order: questions.length + 1,
      title: "",
      type: "text",
      required: false,
      options: [],
      placeholder: ""
    };
    setQuestions([...questions, newQuestion]);
  };

  const duplicateQuestion = (id: string) => {
    const questionToDuplicate = questions.find(q => q.id === id);
    if (questionToDuplicate) {
      const newQuestion: Question = {
        ...questionToDuplicate,
        id: Date.now().toString(),
        order: questions.length + 1
      };
      setQuestions([...questions, newQuestion]);
    }
  };

  const deleteQuestion = (id: string) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    // Reorder remaining questions
    const reorderedQuestions = updatedQuestions.map((q, index) => ({
      ...q,
      order: index + 1
    }));
    setQuestions(reorderedQuestions);
  };

  const updateQuestion = (id: string, field: keyof Question, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        const updated = { ...q, [field]: value };
        // Reset options when changing type
        if (field === "type") {
          if (value === "single-choice" || value === "multiple-choice") {
            updated.options = ["אופציה 1", "אופציה 2"];
          } else if (value === "rating") {
            updated.minRating = 1;
            updated.maxRating = 5;
          } else {
            updated.options = [];
          }
        }
        return updated;
      }
      return q;
    }));
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: [...q.options, `אופציה ${q.options.length + 1}`] };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.options) {
        return { ...q, options: q.options.filter((_, i) => i !== optionIndex) };
      }
      return q;
    }));
  };

  const moveQuestion = (id: string, direction: "up" | "down") => {
    const index = questions.findIndex(q => q.id === id);
    if (
      (direction === "up" && index === 0) || 
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
    
    // Update order
    const reorderedQuestions = newQuestions.map((q, idx) => ({
      ...q,
      order: idx + 1
    }));
    setQuestions(reorderedQuestions);
  };

  const getIconForType = (type: QuestionType) => {
    const option = questionTypeOptions.find(opt => opt.value === type);
    return option ? option.icon : FileText;
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {questions.map((question, index) => {
        const Icon = getIconForType(question.type);
        return (
          <div
            key={question.id}
            className="bg-card rounded-xl p-4 border border-border shadow-sm hover:shadow-md transition-all"
          >
            {/* Question Header with Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-move"
                  onClick={() => {}}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => duplicateQuestion(question.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${question.id}`}
                    checked={question.required}
                    onCheckedChange={(checked) => 
                      updateQuestion(question.id, "required", checked)
                    }
                  />
                  <label 
                    htmlFor={`required-${question.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    חובה
                  </label>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  Q{question.order}
                </span>
              </div>
            </div>

            {/* Question Type Selector */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">סוג השאלה</label>
              <Select
                value={question.type}
                onValueChange={(value) => 
                  updateQuestion(question.id, "type", value as QuestionType)
                }
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>
                        {questionTypeOptions.find(opt => opt.value === question.type)?.label}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {questionTypeOptions.map((option) => {
                    const OptionIcon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <OptionIcon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Question Title */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">טקסט השאלה</label>
              <Textarea
                placeholder="הכנס את שאלתך כאן..."
                value={question.title}
                onChange={(e) => updateQuestion(question.id, "title", e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Type-specific fields */}
            {(question.type === "single-choice" || question.type === "multiple-choice") && (
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">אופציות</label>
                <div className="space-y-2">
                  {question.options?.map((option, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(question.id, idx, e.target.value)}
                        placeholder={`אופציה ${idx + 1}`}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(question.id, idx)}
                        disabled={question.options!.length <= 2}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(question.id)}
                    className="w-full"
                  >
                    + הוסף אופציה
                  </Button>
                </div>
              </div>
            )}

            {question.type === "rating" && (
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">מינימום</label>
                  <Input
                    type="number"
                    value={question.minRating || 1}
                    onChange={(e) => updateQuestion(question.id, "minRating", parseInt(e.target.value))}
                    min={1}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">מקסימום</label>
                  <Input
                    type="number"
                    value={question.maxRating || 5}
                    onChange={(e) => updateQuestion(question.id, "maxRating", parseInt(e.target.value))}
                    min={2}
                    max={10}
                  />
                </div>
              </div>
            )}


            {/* Move buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveQuestion(question.id, "up")}
                disabled={index === 0}
              >
                הזז למעלה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveQuestion(question.id, "down")}
                disabled={index === questions.length - 1}
              >
                הזז למטה
              </Button>
            </div>
          </div>
        );
      })}

      {/* Add Question Button */}
      <Button
        onClick={addQuestion}
        variant="outline"
        className="w-full border-dashed border-2 h-12"
      >
        + הוסף שאלה
      </Button>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center pt-4 border-t">
        <Button
          onClick={() => onSave(questions)}
          className="bg-primary hover:bg-primary/90 text-white px-8"
          size="lg"
        >
          שמור שאלון
        </Button>
        <Button
          onClick={() => {
            // Show preview modal or navigate to preview
            if (questions.length > 0) {
              // Create a preview URL or trigger preview
              const previewData = {
                questions: questions,
                mode: 'form' // default to form view
              };
              // Store in sessionStorage for preview
              sessionStorage.setItem('questionnairePreview', JSON.stringify(previewData));
              // Open preview in new tab
              window.open('/questionnaire-view/preview?mode=form', '_blank');
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8"
          size="lg"
          disabled={questions.length === 0}
        >
          הצגת השאלון
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="lg"
        >
          ביטול
        </Button>
      </div>
    </div>
  );
};

export default QuestionBuilder;
