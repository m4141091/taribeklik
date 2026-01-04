import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/hero-background.png";
import heroSeparator from "@/assets/hero-separator.png";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-background/20" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-6 md:px-12 pt-32 pb-48">
        <div className="max-w-2xl">
          {/* Premium Produce - Script text */}
          <p className="font-script text-primary text-2xl md:text-3xl mb-4">
            Premium Produce
          </p>

          {/* Main Heading */}
          <h1 className="font-discovery font-bold text-foreground text-h1-mobile md:text-h1-desktop mb-6 leading-tight">
            טריות ואיכות
            <br />
            עד הבית
          </h1>

          {/* Description */}
          <p className="font-discovery font-light text-foreground text-p-mobile md:text-p-desktop mb-8 max-w-lg">
            כי איכות אמיתית מתחילה בחירה חכמה! מזמינים בכיף ונהנים עם פירות וירקות טריים, טעמים בריאים הכי הכי ביותר
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Products Button */}
            <Button
              size="lg"
              className="group flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-lg"
            >
              <span>למוצרים</span>
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </Button>

            {/* Search Button */}
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-6 py-3 border border-border">
              <Search className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">חפש מוצר</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Separator - Torn Paper Effect */}
      <div className="absolute bottom-0 left-0 right-0 w-full">
        <img 
          src={heroSeparator} 
          alt="" 
          className="w-full h-auto object-cover"
          aria-hidden="true"
        />
      </div>
    </section>
  );
};

export default Hero;
