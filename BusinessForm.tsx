
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import HoogiTip from "@/components/HoogiTip";
import { Mic, Upload, Facebook, Instagram, Linkedin, Youtube, Globe, Plus, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const BusinessForm = () => {
  const [businessData, setBusinessData] = useState({
    businessName: "",
    mobile: "",
    email: "",
    mainCategory: "",
    customMainCategory: "",
    subCategory: "",
    customSubCategory: "",
    mainService: "",
    website: "",
    logoUploaded: false
  });

  // Media and Links state
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    instagram: "",
    linkedin: "",
    tiktok: "",
    youtube: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [infoSources, setInfoSources] = useState<string[]>([]);
  const [newInfoSource, setNewInfoSource] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [backgroundColor, setBackgroundColor] = useState("#f8fafc");
  
  // Preview URLs for logo and avatar
  const [logoPreview, setLogoPreview] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  const handleBusinessDataChange = (field: string, value: string) => {
    setBusinessData({
      ...businessData,
      [field]: value
    });
  };

  const handleSaveBusinessData = () => {
    // Save branding data to localStorage for QuestionnaireView
    const brandingData = {
      primaryColor,
      secondaryColor,
      backgroundColor,
      logoUrl: logoPreview,
      profileImageUrl: avatarPreview,
      businessName: businessData.businessName || 'העסק שלי'
    };
    localStorage.setItem('businessBranding', JSON.stringify(brandingData));
    
    // In a real app, this would save to a backend
    toast.success("פרטי העסק נשמרו בהצלחה");
  };

  // Media and Links handlers
  const handleSocialLinkChange = (network: string, value: string) => {
    setSocialLinks({
      ...socialLinks,
      [network]: value
    });
  };

  const handleAddSource = () => {
    if (newInfoSource.trim() && !infoSources.includes(newInfoSource.trim())) {
      setInfoSources([...infoSources, newInfoSource.trim()]);
      setNewInfoSource("");
    }
  };

  const handleRemoveSource = (source: string) => {
    setInfoSources(infoSources.filter(s => s !== source));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Dynamic subcategories based on main category
  const getSubcategories = (mainCategory: string) => {
    switch (mainCategory) {
      case "עריכת-דין":
        return ["דיני משפחה", "מסחרי", "קניין רוחני", "דיני עבודה", "נדל\"ן", "אחר"];
      case "מטפלים ומאמנים":
        return ["NLP", "קואצ'ינג", "פסיכולוגיה", "רפלקסולוגיה", "פיזיותרפיה", "אחר"];
      case "ייעוץ":
        return ["עסקי", "כלכלי", "אישי", "ארגוני", "אחר"];
      case "ביטוח":
        return ["חיים", "בריאות", "רכב", "דירה", "עסק", "אחר"];
      case "קוסמטיקה":
        return ["טיפולי פנים", "טיפולי גוף", "מניקור", "פדיקור", "אחר"];
      case "נדל\"ן":
        return ["עיצוב פנים", "אדריכלות", "שיפוצים", "תיווך", "ייעוץ השקעות", "אחר"];
      default:
        return ["אחר"];
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <HoogiTip tip="טיפ: מלאי כאן את פרטי העסק כדי שה-AI יתאים עבורך תכנים מדויקים יותר." />
      </div>
      
      {/* כרטיס 1: פרטי עסק בסיסיים */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-6 shadow-sm border border-primary/20">
        <h2 className="text-xl font-bold mb-6 text-right flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          פרטי עסק בסיסיים
        </h2>

        <div className="space-y-6">
          {/* שורה 1: שם העסק */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="text-right font-semibold">
              שם העסק <span className="text-red-500">*</span> <HoogiTip tip="השם שיופיע בתוכן שייווצר" />
            </Label>
            <Input 
              id="businessName" 
              value={businessData.businessName} 
              onChange={(e) => handleBusinessDataChange("businessName", e.target.value)}
              className="text-right bg-white"
              placeholder="הכנס את שם העסק"
              required
            />
          </div>

          {/* שורה 2: וואטסאפ ומייל */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-right font-semibold">
                וואטסאפ <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="mobile" 
                type="tel"
                value={businessData.mobile} 
                onChange={(e) => handleBusinessDataChange("mobile", e.target.value)} 
                placeholder="050-1234567"
                className="text-right bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-right font-semibold">
                מייל <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="email" 
                type="email"
                value={businessData.email} 
                onChange={(e) => handleBusinessDataChange("email", e.target.value)} 
                placeholder="example@email.com"
                className="text-right bg-white"
                required
              />
            </div>
          </div>

          {/* שורה 3: תחום, תת תחום, עיסוק עיקרי - מימין לשמאל */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainCategory" className="text-right font-semibold">
                תחום <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={businessData.mainCategory} 
                onValueChange={(value) => handleBusinessDataChange("mainCategory", value)}
                required
              >
                <SelectTrigger id="mainCategory" className="text-right bg-white">
                  <SelectValue placeholder="בחר תחום" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="מטפלים ומאמנים">מטפלים ומאמנים</SelectItem>
                    <SelectItem value="ייעוץ">ייעוץ</SelectItem>
                    <SelectItem value="עריכת-דין">עריכת דין</SelectItem>
                    <SelectItem value="ביטוח">ביטוח</SelectItem>
                    <SelectItem value="קוסמטיקה">קוסמטיקה</SelectItem>
                    <SelectItem value="נדל&quot;ן">נדל&quot;ן</SelectItem>
                    <SelectItem value="אחר">אחר</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {businessData.mainCategory === "אחר" && (
                <Input 
                  className="mt-2 text-right bg-white"
                  placeholder="תארי בקצרה את תחום העסק שלך"
                  value={businessData.customMainCategory}
                  onChange={(e) => handleBusinessDataChange("customMainCategory", e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subCategory" className="text-right font-semibold">
                תת תחום <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={businessData.subCategory} 
                onValueChange={(value) => handleBusinessDataChange("subCategory", value)}
                disabled={!businessData.mainCategory}
                required
              >
                <SelectTrigger id="subCategory" className="text-right bg-white">
                  <SelectValue placeholder={businessData.mainCategory ? "בחר תת-תחום" : "בחר תחום תחילה"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {businessData.mainCategory && 
                      getSubcategories(businessData.mainCategory).map(subCat => (
                        <SelectItem key={subCat} value={subCat}>{subCat}</SelectItem>
                      ))
                    }
                  </SelectGroup>
                </SelectContent>
              </Select>
              {businessData.subCategory === "אחר" && (
                <Input 
                  className="mt-2 text-right bg-white"
                  placeholder="פרטי את תת-התחום"
                  value={businessData.customSubCategory}
                  onChange={(e) => handleBusinessDataChange("customSubCategory", e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mainService" className="text-right font-semibold">
                עיסוק עיקרי <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="mainService" 
                value={businessData.mainService} 
                onChange={(e) => handleBusinessDataChange("mainService", e.target.value)} 
                placeholder="תיאור העיסוק העיקרי"
                className="text-right bg-white"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* כרטיס 2: תמונות ומדיה */}
      <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-xl p-6 shadow-sm border border-secondary/20">
        <h2 className="text-xl font-bold mb-6 text-right flex items-center gap-2">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          תמונות ומדיה
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <h3 className="text-base font-semibold mb-4 text-right">לוגו העסק</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center border-2 border-dashed border-primary/30 rounded-lg p-3 h-[100px] bg-primary/5">
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="h-[70px] w-[70px] object-contain" 
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">העלה לוגו</p>
                    <p className="text-xs text-muted-foreground">מומלץ 200×200 פיקסלים</p>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  העלה לוגו
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-border">
            <h3 className="text-base font-semibold mb-4 text-right">תמונת פרופיל</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-center border-2 border-dashed border-secondary/30 rounded-lg p-3 h-[100px] bg-secondary/5">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="h-[70px] w-[70px] object-cover rounded-full" 
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-secondary" />
                    <p className="text-sm text-muted-foreground">העלה תמונת פרופיל</p>
                    <p className="text-xs text-muted-foreground">מומלץ 200×200 פיקסלים</p>
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  העלה תמונה
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* כרטיס 3: צבעי מותג */}
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm border border-purple-200">
        <h2 className="text-xl font-bold mb-6 text-right flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          צבעי מותג
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
            <Label className="text-right font-semibold">צבע ראשי</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-14 h-10 rounded border-2 cursor-pointer"
              />
              <Input 
                value={primaryColor} 
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="text-right flex-1"
              />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
            <Label className="text-right font-semibold">צבע משני</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="w-14 h-10 rounded border-2 cursor-pointer"
              />
              <Input 
                value={secondaryColor} 
                onChange={(e) => setSecondaryColor(e.target.value)}
                className="text-right flex-1"
              />
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
            <Label className="text-right font-semibold">צבע רקע</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-14 h-10 rounded border-2 cursor-pointer"
              />
              <Input 
                value={backgroundColor} 
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="text-right flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* כרטיס 4: רשתות חברתיות */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200">
        <h2 className="text-xl font-bold mb-6 text-right flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          רשתות חברתיות
        </h2>

        <div className="space-y-4">
          {/* שורה ראשונה - 3 רשתות */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
              <Label htmlFor="facebook" className="text-right flex items-center gap-2 justify-end font-semibold">
                <Facebook className="h-5 w-5 text-blue-600" />
                Facebook
              </Label>
              <Input 
                id="facebook" 
                value={socialLinks.facebook} 
                onChange={(e) => handleSocialLinkChange("facebook", e.target.value)} 
                placeholder="https://facebook.com/..."
                className="text-right"
              />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
              <Label htmlFor="instagram" className="text-right flex items-center gap-2 justify-end font-semibold">
                <Instagram className="h-5 w-5 text-pink-600" />
                Instagram
              </Label>
              <Input 
                id="instagram" 
                value={socialLinks.instagram} 
                onChange={(e) => handleSocialLinkChange("instagram", e.target.value)} 
                placeholder="https://instagram.com/..."
                className="text-right"
              />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
              <Label htmlFor="linkedin" className="text-right flex items-center gap-2 justify-end font-semibold">
                <Linkedin className="h-5 w-5 text-blue-700" />
                LinkedIn
              </Label>
              <Input 
                id="linkedin" 
                value={socialLinks.linkedin} 
                onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)} 
                placeholder="https://linkedin.com/in/..."
                className="text-right"
              />
            </div>
          </div>
          
          {/* שורה שנייה - 2 רשתות */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
              <Label htmlFor="tiktok" className="text-right flex items-center gap-2 justify-end font-semibold">
                <Globe className="h-5 w-5 text-black" />
                TikTok
              </Label>
              <Input 
                id="tiktok" 
                value={socialLinks.tiktok} 
                onChange={(e) => handleSocialLinkChange("tiktok", e.target.value)} 
                placeholder="https://tiktok.com/@..."
                className="text-right"
              />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
              <Label htmlFor="youtube" className="text-right flex items-center gap-2 justify-end font-semibold">
                <Youtube className="h-5 w-5 text-red-600" />
                YouTube
              </Label>
              <Input 
                id="youtube" 
                value={socialLinks.youtube} 
                onChange={(e) => handleSocialLinkChange("youtube", e.target.value)} 
                placeholder="https://youtube.com/@..."
                className="text-right"
              />
            </div>
          </div>
        </div>
      </div>

      {/* כרטיס 5: מידע נוסף */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border border-green-200">
        <h2 className="text-xl font-bold mb-6 text-right flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          מידע נוסף
        </h2>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm space-y-2">
            <Label htmlFor="website" className="text-right font-semibold">אתר עסקי</Label>
            <Input 
              id="website" 
              type="url"
              value={businessData.website} 
              onChange={(e) => handleBusinessDataChange("website", e.target.value)} 
              placeholder="https://example.com"
              className="text-right"
            />
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
            <Label className="text-right font-semibold">מקורות מידע על העסק</Label>
            
            {/* הוספת קישור */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-right">הוסף קישור</p>
              <div className="flex gap-2">
                <Input 
                  value={newInfoSource}
                  onChange={(e) => setNewInfoSource(e.target.value)}
                  placeholder="הדבק קישור (כתובת, מאמר, וכו')"
                  className="text-right"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSource()}
                />
                <Button onClick={handleAddSource} size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* העלאת קבצי PDF ותמונות */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-right">העלה מסמכים ותמונות (PDF, JPG, PNG)</p>
              <div>
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('pdf-upload')?.click()}
                  className="w-full bg-green-50 border-green-200 hover:bg-green-100"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  העלה קבצים ותמונות
                </Button>
              </div>
            </div>

            {/* תצוגת קישורים וקבצים */}
            {(infoSources.length > 0 || uploadedFiles.length > 0) && (
              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-right">מקורות שהוספו:</p>
                <div className="flex flex-wrap gap-2">
                  {/* קישורים */}
                  {infoSources.map((source, index) => (
                    <Badge key={`link-${index}`} className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-2 px-3 py-1">
                      <Globe className="h-3 w-3" />
                      {source.length > 30 ? source.substring(0, 30) + '...' : source}
                      <button 
                        onClick={() => handleRemoveSource(source)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {/* קבצים */}
                  {uploadedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <Badge key={`file-${index}`} className={`${isImage ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : 'bg-red-100 text-red-800 hover:bg-red-200'} flex items-center gap-2 px-3 py-1`}>
                        {isImage ? (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                        <button 
                          onClick={() => handleRemoveFile(index)}
                          className="hover:text-red-900 transition-colors"
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <Button onClick={handleSaveBusinessData} size="lg" className="px-8">שמור פרטי עסק</Button>
      </div>
    </div>
  );
};

export default BusinessForm;
