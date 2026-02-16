
## שינוי: פאנל עריכה נפתח רק בלחיצה ישירה על אלמנט בקנבס

### מה ישתנה
כרגע, בכל פעם שנבחר אלמנט (גם מהרשימה בצד וגם מהקנבס) - פאנל העריכה נפתח. השינוי יפריד בין "בחירה" (הדגשה בלבד) ל"עריכה" (פתיחת הפאנל).

### איך זה יעבוד
- **לחיצה על אלמנט ברשימה בצד** - רק מסמן אותו (הדגשה בקנבס), בלי לפתוח את פאנל העריכה
- **לחיצה על אלמנט בקנבס** - מסמן אותו וגם פותח את פאנל העריכה
- **לחיצה על הרקע בקנבס** - סוגר את הפאנל ומבטל בחירה

### פרטים טכניים

**`src/pages/HomepageEditor.tsx`**:
- הוספת state חדש `editingElementId` (בנוסף ל-`selectedElementId` הקיים)
- פאנל העריכה ייפתח רק כש-`editingElementId` מוגדר
- לחיצה על הרקע תאפס את שני ה-states
- הפונקציה `onClick` ב-`DraggableElement` תעדכן גם `selectedElementId` וגם `editingElementId`
- הרשימה בצד תעדכן רק את `selectedElementId`

**`src/components/homepage/editor/DraggableElement.tsx`**:
- הוספת prop חדש `onEdit` שייקרא בלחיצה על אלמנט בקנבס

**`src/components/homepage/editor/ElementsList.tsx`**:
- ללא שינוי - ממשיך לעדכן רק `selectedId` (בחירה בלבד)
