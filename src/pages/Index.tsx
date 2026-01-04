import Header from "@/components/Header";
import Hero from "@/components/Hero";

const Index = () => {
  return (
    <main className="min-h-screen">
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
