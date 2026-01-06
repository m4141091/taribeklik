import React from 'react';
import { useParams } from 'react-router-dom';
import { useActiveSection } from '@/hooks/useSections';
import { SectionViewer } from '@/components/sections/SectionViewer';

const SectionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { section, loading } = useActiveSection(id || '');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">הסקשן לא נמצא</p>
      </div>
    );
  }

  return <SectionViewer section={section} />;
};

export default SectionPage;
