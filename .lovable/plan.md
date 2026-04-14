

## תיקון תצוגת תמונה בעריכת מוצר

### הבעיה
התמונה עולה בהצלחה לשרת (ההעלאה מחזירה 200), אבל לא מוצגת בתצוגה המקדימה בטופס העריכה. שתי בעיות זוהו:

### סיבות הבעיה

**1. `useProducts()` נוצר בתוך `ProductImageUploader`**
הקומפוננטה יוצרת מופע נפרד של `useProducts()` רק בשביל פונקציית `uploadImage`. זה גורם ל-fetch מיותר של כל המוצרים בכל רנדור, ועלול לגרום לבעיות ביצועים.

**2. `form.setValue` לא מעדכן את ה-watch**
כש-`onImageChange` קורא ל-`form.setValue('image_url', url)`, ייתכן שזה לא מפעיל re-render מספיק כי חסרות אופציות `shouldDirty` ו-`shouldValidate`.

### מה ישתנה

**קובץ: `src/components/admin/ProductImageUploader.tsx`**
- הסרת ה-import של `useProducts` מתוך הקומפוננטה
- קבלת `uploadImage` כ-prop במקום ליצור מופע חדש

**קובץ: `src/components/admin/ProductFormDialog.tsx`**
- העברת `uploadImage` מ-`useProducts` כ-prop ל-`ProductImageUploader`
- שינוי `form.setValue('image_url', url)` ל-`form.setValue('image_url', url, { shouldDirty: true, shouldValidate: true })` כדי להבטיח שה-watch מתעדכן

