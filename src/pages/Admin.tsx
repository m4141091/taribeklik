import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { useSections } from '@/hooks/useSections';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, LogOut, Eye, EyeOff } from 'lucide-react';

const AdminContent = () => {
  const { signOut } = useAuthContext();
  const { sections, loading, createSection, updateSection, deleteSection } = useSections();
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionSlug, setNewSectionSlug] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateSection = async () => {
    if (!newSectionName || !newSectionSlug) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא שם ו-slug',
        variant: 'destructive',
      });
      return;
    }

    try {
      const section = await createSection(newSectionName, newSectionSlug);
      setNewSectionName('');
      setNewSectionSlug('');
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם הסקשן</label>
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="למשל: הירו ראשי"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug (מזהה ייחודי)</label>
                <Input
                  value={newSectionSlug}
                  onChange={(e) => setNewSectionSlug(e.target.value)}
                  placeholder="למשל: main-hero"
                  dir="ltr"
                />
              </div>
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
          <div className="grid gap-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="bg-card rounded-lg border border-border p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-foreground">{section.name}</h3>
                  <p className="text-sm text-muted-foreground">/{section.slug}</p>
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
