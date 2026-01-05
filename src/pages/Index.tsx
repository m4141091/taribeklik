import Header from "@/components/Header";
import { DynamicSections } from "@/components/sections/DynamicSections";

const Index = () => {
  return (
    <main className="min-h-screen">
      
      <Header />
      
      {/* Dynamic Sections from Builder */}
      <DynamicSections />
      
      {/* Placeholder for next sections */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">סקשנים נוספים יתווספו בקרוב...</p>
        </div>
      </section>
    </main>
  );
};

export default Index;
