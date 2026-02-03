import Header from "@/components/Header";
import homepageBackground from "@/assets/homepage-background.png";

const Index = () => {
  return (
    <main 
      className="bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ 
        backgroundImage: `url(${homepageBackground})`,
        minHeight: '2500px', // Full page height to show entire background
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
