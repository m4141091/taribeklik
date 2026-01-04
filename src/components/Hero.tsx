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
      <div className="container relative z-10 mx-auto px-[150px] pt-[140px]">
        <div className="max-w-[600px] text-right">
          {/* Premium Produce - Script text */}
          <p className="font-script text-primary text-[144px] leading-none mb-4 overflow-hidden">
            <span className="typewriter inline-block">Premium Produce</span>
          </p>

          {/* Main Heading */}
          <h1 className="font-cooperative text-foreground text-[72px] leading-[1.1] mb-6">
            טריות ואיכות
            <br />
            עד הבית
          </h1>

          {/* Description */}
          <p className="font-discovery font-light text-foreground text-[16px] leading-relaxed mb-8 max-w-[380px] mr-0 ml-auto">
            כי איכות אמיתית מתחילה בחירה חכמה!
            <br />
            מזמינים בכיף ונהנים עם פירות וירקות טריים,
            <br />
            טעמים בריאים הכי הכי ביותר
          </p>

          {/* Products Button */}
          <Button
            size="lg"
            className="group flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-3 text-[16px] mb-6"
          >
            <span>למוצרים</span>
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </Button>

          {/* Search Input */}
          <div className="flex items-center gap-3 bg-background rounded-full px-6 py-3 border border-border max-w-[280px]">
            <span className="text-muted-foreground text-[14px]">חפש מוצר</span>
            <Search className="w-5 h-5 text-primary mr-auto" />
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
