import Header from "@/components/Header";
import homepageBackground from "@/assets/homepage-background.png";
import { HomepageViewer } from "@/components/homepage/HomepageViewer";

const Index = () => {
  return (
    <main 
      className="w-full min-h-screen relative bg-background"
      style={{ 
        backgroundImage: `url(${homepageBackground})`,
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        minHeight: '6000px',
      }}
      dir="rtl"
    >
      <Header />
      
      {/* Dynamic homepage elements from database */}
      <div className="relative" style={{ height: '6000px' }}>
        <HomepageViewer />
      </div>
    </main>
  );
};

export default Index;
