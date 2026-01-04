import { ShoppingBag, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
const Header = () => {
  const navItems = [{
    label: "בית",
    href: "/"
  }, {
    label: "אודות",
    href: "/about"
  }, {
    label: "תהליך",
    href: "/process"
  }, {
    label: "קטגוריות",
    href: "/categories"
  }];
  return <header dir="rtl" className="fixed top-0 right-0 left-0 z-50 px-6 h-[60px] bg-background/65 backdrop-blur-sm md:px-[100px] border-b border-gray-200/30 shadow-sm">
      <div className="container mx-auto grid grid-cols-3 items-center h-full">
        {/* Navigation - Right Side */}
        <nav className="hidden md:flex items-center gap-8 justify-start">
          {navItems.map(item => <a key={item.label} href={item.href} className="text-foreground font-discovery font-light text-lg hover:text-primary transition-colors px-0 py-[15px]">
              {item.label}
            </a>)}
        </nav>
        <div className="md:hidden" />

        {/* Logo - Center */}
        <div className="flex items-center justify-center">
          <img src={logo} alt="טרי בקליק" className="h-[16vh] md:h-[24vh] translate-y-[50%]" />
        </div>

        {/* Action Buttons - Left Side */}
        <div className="flex items-center gap-3 justify-end">
          <Button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-brand-orange-light to-brand-orange text-white hover:opacity-90 rounded-full px-6">
            <UserRound className="w-4 h-4" />
            <span>התחברות / הרשמה</span>
          </Button>
          
          <Button className="flex items-center gap-2 bg-gradient-to-r from-brand-orange-light to-brand-orange text-white hover:opacity-90 rounded-full px-6">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">מעבר לסל</span>
          </Button>
        </div>
      </div>
    </header>;
};
export default Header;