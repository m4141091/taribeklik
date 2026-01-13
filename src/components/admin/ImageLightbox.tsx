import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Wand2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateProductImage, editProductImage, uploadBase64Image } from '@/lib/productImageAI';
import { removeBackgroundFromUrl } from '@/lib/removeBackground';
import productCardBg from '@/assets/product-card-bg.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl?: string | null;
  productName: string;
  productId: string;
  onImageUpdate: (productId: string, newImageUrl: string) => Promise<void>;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
  open,
  onOpenChange,
  imageUrl,
  productName,
  productId,
  onImageUpdate,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setEditInstruction('');
      setPreviewUrl(null);
      setHasChanges(false);
    }
  }, [open]);

  const currentImageUrl = previewUrl || imageUrl;

  const handleGenerateAI = async () => {
    if (!productName.trim()) {
      toast({
        title: 'שגיאה',
        description: 'שם המוצר נדרש ליצירת תמונה',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const base64Image = await generateProductImage(productName);
      const uploadedUrl = await uploadBase64Image(base64Image);
      setPreviewUrl(uploadedUrl);
      setHasChanges(true);
      toast({ title: 'התמונה נוצרה בהצלחה!' });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'שגיאה ביצירת התמונה',
        description: error instanceof Error ? error.message : 'נסי שוב',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditAI = async () => {
    if (!currentImageUrl) {
      toast({
        title: 'שגיאה',
        description: 'אין תמונה לעריכה',
        variant: 'destructive',
      });
      return;
    }

    if (!editInstruction.trim()) {
      toast({
        title: 'שגיאה',
        description: 'נא להזין הוראות לעריכה',
        variant: 'destructive',
      });
      return;
    }

    setIsEditing(true);
    try {
      const base64Image = await editProductImage(currentImageUrl, editInstruction);
      const uploadedUrl = await uploadBase64Image(base64Image);
      setPreviewUrl(uploadedUrl);
      setHasChanges(true);
      setEditInstruction('');
      toast({ title: 'התמונה עודכנה בהצלחה!' });
    } catch (error) {
      console.error('Error editing image:', error);
      toast({
        title: 'שגיאה בעריכת התמונה',
        description: error instanceof Error ? error.message : 'נסי שוב',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!currentImageUrl) {
      toast({
        title: 'שגיאה',
        description: 'אין תמונה להסרת רקע',
        variant: 'destructive',
      });
      return;
    }

    setIsRemovingBg(true);
    try {
      toast({ 
        title: 'מסיר רקע...', 
        description: 'פעם ראשונה לוקח כ-30 שניות להורדת המודל' 
      });
      const newImageUrl = await removeBackgroundFromUrl(currentImageUrl);
      setPreviewUrl(newImageUrl);
      setHasChanges(true);
      toast({ title: 'הרקע הוסר בהצלחה!' });
    } catch (error) {
      console.error('Error removing background:', error);
      toast({
        title: 'שגיאה בהסרת הרקע',
        description: error instanceof Error ? error.message : 'נסי שוב',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleSave = async () => {
    if (!previewUrl) return;

    setIsSaving(true);
    try {
      await onImageUpdate(productId, previewUrl);
      setHasChanges(false);
      toast({ title: 'התמונה נשמרה בהצלחה!' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving image:', error);
      toast({
        title: 'שגיאה בשמירת התמונה',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isGenerating || isEditing || isSaving || isRemovingBg;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">{productName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Display */}
          <div 
            className="flex justify-center rounded-lg p-4 min-h-[300px] items-center"
            style={{
              backgroundImage: `url(${productCardBg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {currentImageUrl ? (
              <img
                src={currentImageUrl}
                alt={productName}
                className="max-h-[400px] max-w-full rounded-lg object-contain"
              />
            ) : (
              <div className="text-muted-foreground text-center bg-background/80 rounded-lg p-4">
                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>אין תמונה - צרי תמונה חדשה עם AI</p>
              </div>
            )}
          </div>

          {/* AI Buttons */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleGenerateAI}
              disabled={isLoading}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 me-2" />
              )}
              צור ב-AI
            </Button>

            <Button
              onClick={handleEditAI}
              disabled={isLoading || !currentImageUrl}
            >
              {isEditing ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 me-2" />
              )}
              ערוך ב-AI
            </Button>

            <Button
              onClick={handleRemoveBackground}
              disabled={isLoading || !currentImageUrl}
              variant="outline"
            >
              {isRemovingBg ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Eraser className="w-4 h-4 me-2" />
              )}
              הסר רקע
            </Button>
          </div>

          {/* Edit Instructions */}
          <div className="space-y-2">
            <Textarea
              placeholder="הוראות לעריכה (למשל: הוסף רקע לבן, שפר את התאורה, הסר צללים...)"
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              className="text-right min-h-[80px]"
              dir="rtl"
              disabled={isLoading}
            />
          </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="flex justify-center pt-2">
              <Button onClick={handleSave} disabled={isSaving} size="lg">
                {isSaving ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : null}
                שמור שינויים
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
