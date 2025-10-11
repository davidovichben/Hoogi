import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, Calendar, Mic, Paperclip } from "lucide-react";
import { Question } from "./QuestionBuilder";

interface FormPreviewProps {
  questions: Question[];
  formTitle?: string;
  formDescription?: string;
  logoUrl?: string;
  profileImageUrl?: string;
}

const FormPreview = ({ 
  questions, 
  formTitle = "שאלון לדוגמה",
  formDescription = "נשמח אם תוכל למלא את השאלון הבא",
  logoUrl,
  profileImageUrl 
}: FormPreviewProps) => {
  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case "text":
        return (
          <Textarea 
            placeholder={question.placeholder || "הכנס תשובה..."}
            className="min-h-[100px]"
          />
        );
      
      case "email":
        return (
          <Input 
            type="email" 
            placeholder={question.placeholder || "example@email.com"}
          />
        );
      
      case "phone":
        return (
          <Input 
            type="tel" 
            placeholder={question.placeholder || "050-1234567"}
          />
        );
      
      case "single-choice":
        return (
          <RadioGroup>
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                <Label htmlFor={`${question.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "multiple-choice":
        return (
          <div className="space-y-2">
            {question.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id={`${question.id}-${idx}`} />
                <Label htmlFor={`${question.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      case "rating":
        return (
          <div className="flex gap-2">
            {Array.from({ length: question.maxRating || 5 }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                variant="outline"
                size="icon"
                className="hover:bg-primary/20"
              >
                <Star className="h-5 w-5" />
              </Button>
            ))}
          </div>
        );
      
      case "date":
        return (
          <div className="flex items-center gap-2">
            <Input type="date" />
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        );
      
      case "voice":
        return (
          <Button variant="outline" className="w-full">
            <Mic className="h-5 w-5 ml-2" />
            לחץ להקלטה קולית
          </Button>
        );
      
      case "file-upload":
        return (
          <Button variant="outline" className="w-full">
            <Paperclip className="h-5 w-5 ml-2" />
            העלה קובץ
          </Button>
        );
      
      default:
        return <Input placeholder="הכנס תשובה..." />;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-background">
      <Card className="p-8 shadow-lg">
        {/* Header with logo and profile */}
        <div className="flex flex-col items-center mb-8">
          {logoUrl && (
            <div className="mb-4">
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-24 w-24 object-contain rounded-lg"
              />
            </div>
          )}
          
          {profileImageUrl && (
            <div className="mb-4">
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="h-16 w-16 object-cover rounded-full border-4 border-primary"
              />
            </div>
          )}
          
          <h1 className="text-3xl font-bold text-primary mb-2">
            {formTitle}
          </h1>
          <p className="text-muted-foreground text-center">
            {formDescription}
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base font-semibold">
                {index + 1}. {question.title}
                {question.required && (
                  <span className="text-destructive mr-1">*</span>
                )}
              </Label>
              {renderQuestion(question)}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <Button size="lg" className="px-12">
            שלח שאלון
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default FormPreview;
