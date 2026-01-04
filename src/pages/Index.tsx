import Header from "@/components/Header";
import Hero from "@/components/Hero";

const Index = () => {
  return (
    <main className="min-h-screen">
      {/* Temporary Red Guides - 150px margins */}
      <div className="fixed top-0 right-[150px] w-[1px] h-full bg-red-500 z-[100] pointer-events-none" />
      <div className="fixed top-0 left-[150px] w-[1px] h-full bg-red-500 z-[100] pointer-events-none" />
      
      <Header />
      <Hero />
      
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
