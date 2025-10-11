import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Star, Calendar, Mic, Paperclip } from "lucide-react";
import { Question } from "./QuestionBuilder";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ChatPreviewProps {
  questions: Question[];
  formTitle?: string;
  logoUrl?: string;
}

const ChatPreview = ({ 
  questions,
  formTitle = "שאלון לדוגמה",
  logoUrl = "/hoogi-new-avatar.png"
}: ChatPreviewProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [messages, setMessages] = useState<Array<{ type: 'bot' | 'user', content: any }>>([
    { type: 'bot', content: `שלום! ברוך הבא ל${formTitle}. בואו נתחיל בשאלה הראשונה:` },
    { type: 'bot', content: questions[0]?.title || 'אין שאלות' }
  ]);

  const currentQuestion = questions[currentQuestionIndex];

  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case "text":
        return (
          <div className="flex gap-2">
            <Input 
              placeholder={currentQuestion.placeholder || "הכנס תשובה..."}
              className="flex-1"
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        );
      
      case "email":
        return (
          <div className="flex gap-2">
            <Input 
              type="email" 
              placeholder={currentQuestion.placeholder || "example@email.com"}
              className="flex-1"
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        );
      
      case "phone":
        return (
          <div className="flex gap-2">
            <Input 
              type="tel" 
              placeholder={currentQuestion.placeholder || "050-1234567"}
              className="flex-1"
            />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        );
      
      case "single-choice":
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="w-full justify-start"
              >
                {option}
              </Button>
            ))}
          </div>
        );
      
      case "multiple-choice":
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox id={`chat-${currentQuestion.id}-${idx}`} />
                <Label htmlFor={`chat-${currentQuestion.id}-${idx}`}>{option}</Label>
              </div>
            ))}
            <Button className="w-full mt-3">
              המשך
            </Button>
          </div>
        );
      
      case "rating":
        return (
          <div className="flex gap-2 justify-center flex-wrap">
            {Array.from({ length: currentQuestion.maxRating || 5 }, (_, i) => i + 1).map((num) => (
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
            <Input type="date" className="flex-1" />
            <Button size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
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
        return (
          <div className="flex gap-2">
            <Input placeholder="הכנס תשובה..." className="flex-1" />
            <Button size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card className="flex flex-col h-[600px] shadow-lg overflow-hidden">
        {/* Chat Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
          <Avatar>
            <AvatarImage src={logoUrl} />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold">{formTitle}</h3>
            <p className="text-xs opacity-90">מופעל על ידי AI</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <Avatar className="h-8 w-8 ml-2">
                  <AvatarImage src={logoUrl} />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background border shadow-sm'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {/* Progress indicator */}
          <div className="text-center text-sm text-muted-foreground">
            שאלה {currentQuestionIndex + 1} מתוך {questions.length}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background border-t">
          {renderQuestionInput()}
        </div>
      </Card>
    </div>
  );
};

export default ChatPreview;
