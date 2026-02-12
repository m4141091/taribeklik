import Header from "@/components/Header";
import homepageBackground from "@/assets/homepage-background.png";
import heroVegetables from "@/assets/hero-vegetables.png";
import { HomepageViewer } from "@/components/homepage/HomepageViewer";
import { useBackgroundImageHeight } from "@/hooks/useBackgroundImageHeight";

const Index = () => {
  const bgHeight = useBackgroundImageHeight(homepageBackground, window.innerWidth);

  return (
    <main 
      className="w-full min-h-screen relative bg-background"
      style={{ 
        backgroundImage: `url(${homepageBackground})`,
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        minHeight: `${bgHeight}px`,
      }}
      dir="rtl"
    >
      <Header />
      
      {/* Hero vegetable image - left side, centered vertically in hero area */}
      <img 
        src={heroVegetables}
        alt="ירקות טריים"
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: '50vh',
          transform: 'translateY(-50%)',
          width: 'auto',
          height: '52vh',
          maxWidth: '57%',
          objectFit: 'contain',
          zIndex: 10,
        }}
      />
      
      {/* Dynamic homepage elements from database */}
      <div className="relative" style={{ height: `${bgHeight}px` }}>
        <HomepageViewer bgHeight={bgHeight} />
      </div>
    </main>
  );
};

export default Index;
