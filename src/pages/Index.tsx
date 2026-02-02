import Header from "@/components/Header";
import { DynamicSections } from "@/components/sections/DynamicSections";
import homepageBackground from "@/assets/homepage-background.png";

const Index = () => {
  return (
    <main 
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${homepageBackground})` }}
    >
      <Header />
      
      {/* Dynamic Sections from Builder */}
      <DynamicSections />
    </main>
  );
};

export default Index;
