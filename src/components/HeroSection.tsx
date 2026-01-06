import React from 'react';
import heroBackground from '@/assets/hero-background-new.png';
import heroVisual from '@/assets/hero-visual.png';
import leaf1 from '@/assets/leaf1.png';
import leaf2 from '@/assets/leaf2.png';
import leaf3 from '@/assets/leaf3.png';
import leaf4 from '@/assets/leaf4.png';

const HeroSection = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Heebo:wght@300;400;500;700;900&display=swap');

        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes heroFloatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }

        @keyframes heroFloatDelay {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
        }

        .hero-float { animation: heroFloat 6s ease-in-out infinite; }
        .hero-float-slow { animation: heroFloatSlow 8s ease-in-out infinite; }
        .hero-float-delay { animation: heroFloatDelay 7s ease-in-out infinite 1s; }
        .font-script { font-family: 'Dancing Script', cursive; }
        .font-hebrew { font-family: 'Heebo', sans-serif; }
      `}</style>

      <div className="relative w-full h-screen overflow-hidden font-hebrew" dir="rtl">
        {/* Blue Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-blue-500 z-50" />

        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroBackground}
            alt="Farm Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/40" />
        </div>

        {/* Header */}
        <header className="relative z-40 flex items-center justify-between px-8 py-4">
          {/* Right Side - Navigation */}
          <nav className="flex items-center gap-8">
            <a href="#tools" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              כלי
            </a>
            <a href="#about" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              אודות
            </a>
            <a href="#process" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              תהליך
            </a>
            <a href="#stores" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              קניוניות
            </a>
          </nav>

          {/* Center - Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-800">טרי</span>
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-800">בקליק</span>
            </div>
          </div>

          {/* Left Side - CTA Buttons */}
          <div className="flex items-center gap-3">
            <button className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2">
              <span>מוצר היום</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            <button className="px-6 py-2 bg-orange-500 text-white rounded-full font-medium hover:bg-orange-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105">
              התחברו/הרשמו
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-30 h-full flex items-center justify-center px-8 pt-20">
          <div className="max-w-7xl w-full flex items-center justify-between gap-12">
            
            {/* Left Side - Vegetables Image */}
            <div className="relative w-1/2 flex justify-start">
              <img
                src={heroVisual}
                alt="Fresh Vegetables"
                className="w-full max-w-2xl object-contain hero-float"
              />
            </div>

            {/* Right Side - Content */}
            <div className="w-1/2 flex flex-col items-end text-right pr-12">
              {/* Script Text */}
              <h3 className="text-4xl font-script text-orange-500 mb-4">
                Premium Produce
              </h3>

              {/* Main Heading */}
              <h1 className="text-7xl font-black text-gray-900 leading-tight mb-6">
                טריות ואיכות
                <br />
                עד הבית
              </h1>

              {/* Description */}
              <p className="text-lg text-gray-700 mb-8 max-w-md leading-relaxed">
                כ-180 משקי משפחות חקלאיות במהדורה הכשרה הכי גבוהה,
                <br />
                בנגד למפוקי מייצרים ומפיצים ביום המשלוח, הכל טרי
                <br />
                בפסגות גבוה והכול מגיע אליכם הביתה
              </p>

              {/* CTA Button */}
              <button className="group relative px-8 py-4 bg-orange-500 text-white rounded-full font-bold text-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3">
                <span>למוצרים</span>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
          <div className="bg-white rounded-full shadow-2xl p-2 flex items-center hover:shadow-3xl transition-shadow">
            <input
              type="text"
              placeholder="חיפוש מוצר"
              className="flex-1 px-6 py-3 text-right outline-none text-gray-700 bg-transparent"
            />
            <button className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-all transform hover:scale-110">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Decorative Leaves */}
        <img 
          src={leaf1}
          alt="" 
          className="absolute top-20 right-10 w-16 h-16 opacity-70 hero-float-slow z-20" 
        />
        <img 
          src={leaf2}
          alt="" 
          className="absolute top-40 left-20 w-12 h-12 opacity-60 hero-float-delay z-20" 
        />
        <img 
          src={leaf3}
          alt="" 
          className="absolute bottom-40 right-32 w-14 h-14 opacity-50 hero-float z-20" 
        />
        <img 
          src={leaf4}
          alt="" 
          className="absolute top-1/3 right-80 w-20 h-20 opacity-80 hero-float-slow z-20" 
        />

        {/* Paper Tear Effect at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <svg className="w-full h-24" viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,60 Q120,20 240,60 T480,60 T720,60 T960,60 T1200,60 T1440,60 L1440,120 L0,120 Z"
              fill="white"
              className="drop-shadow-lg"
            />
          </svg>
        </div>

        {/* Green Ground at Very Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-green-900 to-green-950 z-20" />
      </div>
    </>
  );
};

export default HeroSection;
