import { ShoppingCart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const navItems = [
    { label: "בית", href: "/" },
    { label: "אודות", href: "/about" },
    { label: "תהליך", href: "/process" },
    { label: "קטגוריות", href: "/categories" },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 z-50 py-4 px-6 md:px-12 bg-background/65 backdrop-blur-sm">
      <div className="container mx-auto grid grid-cols-3 items-center">
        {/* Navigation - Right Side */}
        <nav className="hidden md:flex items-center gap-8 justify-start">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-foreground font-discovery font-light text-lg hover:text-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="md:hidden" />

        {/* Logo - Center */}
        <div className="flex items-center justify-center">
          <img src={logo} alt="טרי בקליק" className="h-[4.8vh] md:h-[8vh]" />
        </div>

        {/* Action Buttons - Left Side */}
        <div className="flex items-center gap-3 justify-end">
          <Button
            variant="outline"
            className="hidden sm:flex items-center gap-2 border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-6"
          >
            <User className="w-4 h-4" />
            <span>התחברות / הרשמה</span>
          </Button>
          
          <Button
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">מעבר לסל</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
