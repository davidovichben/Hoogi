import React, { useState, useEffect } from "react";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import { Button } from "../../../components/ui/button";
import { Settings, Save, Tag } from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { useLanguage } from "../../../contexts/LanguageContext";
import { DEFAULT_META } from "../../../models/questionnaire";

interface MetaPanelProps {
  questionnaire: any;
  onUpdate: (updates: any) => void;
}

export function MetaPanel({ questionnaire, onUpdate }: MetaPanelProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  // Safe defaults for meta
  const safeMeta = questionnaire.meta || DEFAULT_META;
  
  const [formData, setFormData] = useState({
    title: questionnaire.title || '',
    category: questionnaire.category || '',
    tags: questionnaire.meta?.tags || [],
    primaryLanguage: questionnaire.meta?.primaryLanguage || 'he'
  });
  
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Debounced save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.title !== questionnaire.title || 
          formData.category !== questionnaire.category || 
          formData.primaryLanguage !== questionnaire.meta?.primaryLanguage) {
        handleSave();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, questionnaire.title, questionnaire.category, questionnaire.meta?.primaryLanguage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onUpdate({
        title: formData.title,
        category: formData.category,
        meta: {
          ...questionnaire.meta,
          tags: formData.tags,
          primaryLanguage: formData.primaryLanguage
        }
      });
      
      toast({
        title: language === 'he' ? 'נשמר' : 'Saved',
        description: language === 'he' 
          ? 'השאלון נשמר בהצלחה' 
          : 'Questionnaire saved successfully'
      });
    } catch (error) {
      toast({
        title: language === 'he' ? 'שגיאה בשמירה' : 'Save error',
        description: language === 'he' 
          ? 'לא ניתן היה לשמור את השאלון' 
          : 'Could not save questionnaire',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">
          {language === 'he' ? 'הגדרות בסיסיות' : 'Basic Settings'}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            {language === 'he' ? 'כותרת השאלון' : 'Questionnaire Title'}
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder={language === 'he' ? 'הקלד כותרת...' : 'Enter title...'}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">
            {language === 'he' ? 'קטגוריה' : 'Category'}
          </Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            placeholder={language === 'he' ? 'הקלד קטגוריה...' : 'Enter category...'}
          />
        </div>

        {/* Primary Language */}
        <div className="space-y-2">
          <Label htmlFor="primaryLanguage">
            {language === 'he' ? 'שפה עיקרית' : 'Primary Language'}
          </Label>
          <select
            id="primaryLanguage"
            value={formData.primaryLanguage}
            onChange={(e) => setFormData(prev => ({ ...prev, primaryLanguage: e.target.value }))}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="he">עברית</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">
            {language === 'he' ? 'תגיות' : 'Tags'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'he' ? 'הוסף תגית...' : 'Add tag...'}
              className="flex-1"
            />
            <Button onClick={addTag} size="sm" variant="outline">
              {language === 'he' ? 'הוסף' : 'Add'}
            </Button>
          </div>
          
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {language === 'he' ? 'שומר...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {language === 'he' ? 'שמור' : 'Save'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
