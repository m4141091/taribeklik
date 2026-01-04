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
      <div className="container relative z-10 mx-auto px-[150px] pt-[120px]">
        {/* Premium Produce - Script text - Centered */}
        <p className="font-script text-primary text-[55px] leading-none mb-4 text-center" dir="ltr">
          <TypewriterText 
            text="Premium Produce" 
            typingSpeed={100}
            initialDelay={0.3}
          />
        </p>

        {/* Main Content - Right aligned */}
        <div className="flex flex-col items-end text-right">
          {/* Main Heading */}
          <h1 className="font-cooperative text-foreground text-[72px] leading-[1.1] mb-6">
            טריות ואיכות
            <br />
            עד הבית
          </h1>

          {/* Description */}
          <p className="font-discovery font-light text-foreground text-[16px] leading-[1.8] mb-6 max-w-[320px]">
            כי איכות אמיתית מתחילה בחירה חכמה!
            <br />
            מזמינים בכיף ונהנים עם פירות וירקות טריים,
            <br />
            טעמים בריאים הכי הכי ביותר
          </p>

          {/* Products Button */}
          <Button
            size="lg"
            className="group flex items-center gap-3 bg-background text-foreground hover:bg-background/90 rounded-full px-8 py-3 text-[16px] border border-border shadow-sm"
          >
            <span>למוצרים</span>
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          </Button>
        </div>

        {/* Search Input - Centered */}
        <div className="flex items-center justify-between bg-background rounded-full px-6 py-4 border border-border max-w-[400px] mx-auto mt-8">
          <Search className="w-5 h-5 text-primary" />
          <span className="text-muted-foreground text-[14px]">חפש מוצר</span>
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
