import Header from "@/components/Header";
import homepageBackground from "@/assets/homepage-background.png";

const Index = () => {
  return (
    <main 
      className="bg-no-repeat w-full"
      style={{ 
        backgroundImage: `url(${homepageBackground})`,
        backgroundSize: '100% auto',
        backgroundPosition: 'top center',
        minHeight: '4000px', // Match full background image height
      }}
      dir="rtl"
    >
      <Header />
      
      {/* Full homepage - ready for elements */}
      <div className="container mx-auto px-8 pt-32">
        {/* 
          כאן אפשר להוסיף אלמנטים לאורך כל הדף:
          - כותרות
          - טקסטים
          - כפתורים
          - תמונות
        */}
      </div>
    </main>
  );
};

export default Index;
