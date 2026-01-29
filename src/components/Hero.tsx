import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/hero-background.png";
import heroSeparator from "@/assets/hero-separator.png";
import TypewriterText from "@/components/TypewriterText";

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
      <div className="container relative z-10 mx-auto px-[150px] pt-[80px]">
        <div className="max-w-[600px] text-right">
          {/* Premium Produce - Script text */}
          <div className="mb-1">
            <p className="font-script text-primary text-[75px] leading-none text-right" dir="ltr">
              <TypewriterText 
                text="Premium Produce" 
                typingSpeed={100}
                initialDelay={0.3}
              />
            </p>
          </div>

          {/* Main Heading */}
          <h1 className="font-cooperative text-foreground text-[72px] leading-[1.1] mb-3">
            טריות ואיכות
            <br />
            עד הבית
          </h1>

          {/* Description */}
          <p className="font-discovery font-light text-foreground text-[16px] leading-relaxed mb-4 max-w-[380px] mr-0 ml-auto">
            כי איכות אמיתית מתחילה בחירה חכמה!
            <br />
            מזמינים בכיף ונהנים עם פירות וירקות טריים,
            <br />
            טעמים בריאים הכי הכי ביותר
          </p>

          {/* Products Button */}
          <button
            className="group flex items-center gap-3 bg-background/90 backdrop-blur-sm text-foreground hover:bg-background rounded-full pl-3 pr-6 py-2 text-[16px] mb-3 border border-border/50 shadow-sm transition-all"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
              <ArrowLeft className="w-4 h-4 text-primary-foreground transition-transform group-hover:-translate-x-0.5" />
            </span>
            <span className="font-discovery">למוצרים</span>
          </button>

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
