import { ShoppingBag, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
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
  return <header dir="rtl" className="fixed top-0 right-0 left-0 z-50 px-4 h-[60px] bg-[#F7F2ED]/70 backdrop-blur-sm md:px-8 border-b border-gray-300 shadow-md relative">
      <div className="container mx-auto flex items-center justify-between h-full">
        {/* Navigation - Right Side */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map(item => <a key={item.label} href={item.href} className="text-foreground font-discovery font-light text-lg hover:text-primary transition-colors">
              {item.label}
            </a>)}
        </nav>
        <div className="md:hidden" />

        {/* Action Buttons - Left Side */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-brand-orange-light to-brand-orange text-white hover:opacity-90 rounded-full px-6">
              <UserRound className="w-4 h-4" />
              <span>התחברות / הרשמה</span>
            </Button>
          </Link>
          
          <Button className="flex items-center gap-2 bg-gradient-to-r from-brand-orange-light to-brand-orange text-white hover:opacity-90 rounded-full px-6">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">מעבר לסל</span>
          </Button>
        </div>
      </div>

      {/* Logo - Absolute positioned, centered */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 z-10">
        <img src={logo} alt="טרי בקליק" className="h-[16vh] md:h-[24vh]" />
      </div>
    </header>;
};
export default Header;