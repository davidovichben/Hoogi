import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Badge } from "../../../components/ui/badge";
import { Edit, Save, X, Plus, ArrowLeft } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface QuestionsPreviewProps {
  questions: any[];
  onUpdate: (questions: any[]) => void;
  onBackToEdit: () => void;
}

export function QuestionsPreview({ questions, onUpdate, onBackToEdit }: QuestionsPreviewProps) {
  const { language } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    required: false
  });

  const startEdit = (question: any) => {
    setEditingId(question.id);
    setEditForm({
      title: question.title || '',
      required: question.required || false
    });
  };

  const saveEdit = () => {
    if (!editingId) return;

    const updatedQuestions = questions.map(q => 
      q.id === editingId 
        ? { ...q, ...editForm }
        : q
    );
    
    onUpdate(updatedQuestions);
    setEditingId(null);
    setEditForm({ title: '', required: false });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ title: '', required: false });
  };

  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    onUpdate(updatedQuestions);
  };

  const toggleRequired = (questionId: string) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId
        ? { ...q, required: !q.required }
        : q
    );
    onUpdate(updatedQuestions);
  };

  const addQuestion = () => {
    const newQuestion = {
      id: crypto.randomUUID(),
      title: language === 'he' ? 'שאלה חדשה' : 'New question',
      required: false,
      type: 'text'
    };
    onUpdate([...questions, newQuestion]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {language === 'he' ? 'תצוגה מקדימה של השאלות' : 'Questions Preview'}
            </CardTitle>
            <CardDescription>
              {language === 'he' 
                ? 'ערוך שאלות קיימות או הוסף חדשות' 
                : 'Edit existing questions or add new ones'
              }
            </CardDescription>
          </div>
          <Button onClick={onBackToEdit} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'he' ? 'חזור לעריכה' : 'Back to Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="border rounded-lg p-4">
            {editingId === question.id ? (
              // Edit Mode
              <div className="space-y-3">
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={language === 'he' ? 'הקלד שאלה...' : 'Type question...'}
                />
                <div className="flex items-center gap-2">
                  <Switch
                    id={`required-${question.id}`}
                    checked={editForm.required}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, required: checked }))}
                  />
                  <Label htmlFor={`required-${question.id}`}>
                    {language === 'he' ? 'שאלה חובה' : 'Required question'}
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveEdit} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'שמור' : 'Save'}
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    {language === 'he' ? 'ביטול' : 'Cancel'}
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{question.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={question.required ? "destructive" : "secondary"}>
                        {question.required 
                          ? (language === 'he' ? 'חובה' : 'Required')
                          : (language === 'he' ? 'אופציונלי' : 'Optional')
                        }
                      </Badge>
                      <Badge variant="outline">
                        {question.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => startEdit(question)} size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      onClick={() => deleteQuestion(question.id)} 
                      size="sm" 
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        <Button onClick={addQuestion} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          {language === 'he' ? 'הוסף שאלה' : 'Add Question'}
        </Button>
      </CardContent>
    </Card>
  );
}
