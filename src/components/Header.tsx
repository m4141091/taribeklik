import { ShoppingBag, UserRound, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navItems = [
    { label: "בית", href: "/" },
    { label: "חנות", href: "/shop" },
    { label: "קטגוריות", href: "/shop" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearch(false);
    }
  };

  return (
    <header dir="rtl" className="fixed top-0 right-0 left-0 z-50 px-4 h-[60px] bg-[#F7F2ED]/70 backdrop-blur-sm md:px-8 border-b border-gray-300 shadow-md relative">
      <div className="container mx-auto flex items-center justify-between h-full">
        {/* Navigation - Right Side */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map(item => (
            <Link
              key={item.label}
              to={item.href}
              className="text-foreground font-discovery font-light text-lg hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="md:hidden" />

        {/* Action Buttons - Left Side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש..."
                className="h-9 px-3 rounded-full border border-border bg-white text-sm w-32 sm:w-48"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(false)}
                className="h-9 w-9"
              >
                ✕
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="h-10 w-10"
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          
          <Link to="/login">
            <Button className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-brand-orange-light to-brand-orange text-white hover:opacity-90 rounded-full px-6">
              <UserRound className="w-4 h-4" />
              <span>התחברות / הרשמה</span>
            </Button>
          </Link>
          
          <Link to="/shop">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-brand-orange-light to-brand-orange text-white hover:opacity-90 rounded-full px-6">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">מעבר לחנות</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Logo - Absolute positioned, centered */}
      <Link to="/" className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 z-10">
        <img src={logo} alt="טרי בקליק" className="h-[16vh] md:h-[24vh]" />
      </Link>
    </header>
  );
};

export default Header;