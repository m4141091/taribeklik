import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useSections } from '@/hooks/useSections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Eye, EyeOff, GripVertical } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductsTab from '@/components/admin/ProductsTab';
import CategoriesManager from '@/components/admin/CategoriesManager';
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\w\-א-ת]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `section-${Date.now()}`;
};

const AdminContent = () => {
  const { signOut } = useAuthContext();
  const { sections, loading, createSection, updateSection, deleteSection, reorderSections } = useSections();
  const [newSectionName, setNewSectionName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId) {
      setDraggedSection(null);
      return;
    }

    const newOrder = [...sections];
    const draggedIndex = newOrder.findIndex(s => s.id === draggedSection);
    const targetIndex = newOrder.findIndex(s => s.id === targetSectionId);

    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    try {
      await reorderSections(newOrder);
      toast({ title: 'הסדר עודכן!' });
    } catch {
      toast({ title: 'שגיאה', description: 'שגיאה בעדכון הסדר', variant: 'destructive' });
    }
    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  const handleCreateSection = async () => {
    if (!newSectionName) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא שם לסקשן',
        variant: 'destructive',
      });
      return;
    }

    const slug = generateSlug(newSectionName);

    try {
      const section = await createSection(newSectionName, slug);
      setNewSectionName('');
      setShowCreateForm(false);
      toast({
        title: 'סקשן נוצר!',
        description: 'הסקשן נוצר בהצלחה',
      });
      navigate(`/admin/builder/${section.id}`);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: 'שגיאה',
        description: err.message || 'שגיאה ביצירת הסקשן',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await updateSection(id, { is_active: !currentState });
      toast({
        title: currentState ? 'הסקשן הוסתר' : 'הסקשן פורסם!',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון הסקשן',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`האם למחוק את הסקשן "${name}"?`)) return;

    try {
      await deleteSection(id);
      toast({
        title: 'הסקשן נמחק',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת הסקשן',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">פאנל ניהול</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 ml-2" />
            התנתק
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="sections" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="sections">סקשנים</TabsTrigger>
            <TabsTrigger value="products">מוצרים</TabsTrigger>
            <TabsTrigger value="categories">קטגוריות</TabsTrigger>
          </TabsList>

          <TabsContent value="sections">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">סקשנים</h2>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="w-4 h-4 ml-2" />
                סקשן חדש
              </Button>
            </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-card rounded-lg border border-border p-4 mb-6">
            <h3 className="font-medium mb-4">יצירת סקשן חדש</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">שם הסקשן</label>
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="למשל: הירו ראשי"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateSection}>צור סקשן</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                ביטול
              </Button>
            </div>
          </div>
        )}

        {/* Sections List */}
        {sections.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <p className="text-muted-foreground mb-4">אין סקשנים עדיין</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 ml-2" />
              צור סקשן ראשון
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {sections.map((section) => (
              <div
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, section.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
                onDragEnd={handleDragEnd}
                className={`bg-card rounded-lg border border-border p-4 flex items-center justify-between cursor-grab active:cursor-grabbing transition-opacity ${
                  draggedSection === section.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium text-foreground">{section.name}</h3>
                    <p className="text-sm text-muted-foreground">/{section.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleActive(section.id, section.is_active)}
                    title={section.is_active ? 'הסתר' : 'פרסם'}
                  >
                    {section.is_active ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/admin/builder/${section.id}`)}
                    title="ערוך"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(section.id, section.name)}
                    title="מחק"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="categories">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground">ניהול קטגוריות</h2>
              <CategoriesManager />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const Admin = () => {
  return (
    <AdminGuard>
      <AdminContent />
    </AdminGuard>
  );
};

export default Admin;
