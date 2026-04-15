import React, { useState, useCallback } from 'react';
import { Upload, Wand2, ImageIcon, Loader2, Eraser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateProductImage, editProductImage, uploadBase64Image } from '@/lib/productImageAI';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ProductImageUploaderProps {
  imageUrl?: string;
  productName: string;
  onImageChange: (url: string) => void;
  uploadImage: (file: File) => Promise<string>;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  imageUrl,
  productName,
  onImageChange,
  uploadImage,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'שגיאה',
        description: 'יש לבחור קובץ תמונה',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = await uploadImage(file);
      onImageChange(url);
      toast({ title: 'התמונה הועלתה בהצלחה!' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהעלאת התמונה',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleGenerateAI = async () => {
    if (!productName) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין שם מוצר לפני יצירת תמונה',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const base64Image = await generateProductImage(productName);
      setPreviewUrl(base64Image);
      
      // Upload to storage
      const storageUrl = await uploadBase64Image(base64Image);
      onImageChange(storageUrl);
      setPreviewUrl(null);
      
      toast({ title: 'התמונה נוצרה בהצלחה!' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה ביצירת התמונה',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditAI = async () => {
    if (!imageUrl || !editInstruction) {
      toast({
        title: 'שגיאה',
        description: 'יש להזין הוראות עריכה',
        variant: 'destructive',
      });
      return;
    }

    setIsEditing(true);
    try {
      const base64Image = await editProductImage(imageUrl, editInstruction);
      
      // Upload to storage
      const storageUrl = await uploadBase64Image(base64Image);
      onImageChange(storageUrl);
      
      setShowEditDialog(false);
      setEditInstruction('');
      toast({ title: 'התמונה עודכנה בהצלחה!' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעריכת התמונה',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">תמונת המוצר</label>
      
      {/* Current Image Preview */}
      {(imageUrl || previewUrl) && (
        <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border border-border">
          <img
            src={previewUrl || imageUrl}
            alt="תמונת מוצר"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            גרור תמונה לכאן או לחץ לבחירה
          </p>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGenerateAI}
          disabled={isGenerating || !productName}
          className="flex-1"
        >
        {isGenerating ? (
            <Loader2 className="w-4 h-4 me-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 me-2" />
          )}
          צור ב-AI
        </Button>
        
        {imageUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
            className="flex-1"
          >
            <ImageIcon className="w-4 h-4 me-2" />
            ערוך ב-AI
          </Button>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת תמונה ב-AI</DialogTitle>
          </DialogHeader>
          
          {imageUrl && (
            <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden border border-border">
              <img src={imageUrl} alt="תמונה לעריכה" className="w-full h-full object-cover" />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">הוראות עריכה (בעברית)</label>
            <Textarea
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="למשל: הסר את הרקע והחלף ברקע לבן נקי"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              דוגמאות: "הסר רקע", "הבהר את התמונה", "הוסף עוד פירות"
            </p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleEditAI} disabled={isEditing || !editInstruction}>
              {isEditing ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : null}
              ערוך
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductImageUploader;
