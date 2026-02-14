import React from 'react';

interface WhyUsCard {
  title: string;
  description: string;
  rotation: number;
}

const cards: WhyUsCard[] = [
  {
    title: 'איכות לפני הכול',
    description: 'אנחנו עובדים עם ספקים קבועים ובוחרים רק מה שעומד בסטנדרט הגבוה שלנו.',
    rotation: 5,
  },
  {
    title: 'טיפול אישי בכל הזמנה',
    description: 'מהליקוט ועד האריזה כל הזמנה מקבלת יחס אישי ותשומת לב.',
    rotation: -3,
  },
  {
    title: 'חוויה נוחה ופשוטה',
    description: 'אתם בוחרים, אנחנו דואגים לכל השאר כדי שיגיע אליכם טרי, מסודר ועד הבית.',
    rotation: 4,
  },
  {
    title: 'שקיפות ואחריות',
    description: 'אנחנו עובדים מאחורי כל הזמנה. אם משהו לא עומד בציפיות אנחנו כאן, זמינים וקשובים, כדי לטפל ולתקן.',
    rotation: -5,
  },
];

export const WhyUsCards: React.FC = () => {
  return (
    <div className="w-full h-full relative flex items-center justify-center" dir="rtl">
      {/* Dashed curved line SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M 50 200 C 150 80, 300 320, 450 180 S 700 50, 950 220"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="3"
          strokeDasharray="12 10"
          fill="none"
        />
      </svg>

      {/* Cards container */}
      <div className="relative flex items-center justify-center gap-6 w-full h-full px-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className="relative flex-shrink-0"
            style={{
              transform: `rotate(${card.rotation}deg)`,
              marginTop: index % 2 === 0 ? '20px' : '-20px',
            }}
          >
            {/* Pin/nail */}
            <div
              className="absolute top-[-8px] left-1/2 -translate-x-1/2 z-10"
              style={{ width: '20px', height: '20px' }}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-b from-gray-300 to-gray-500 shadow-md border border-gray-400" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-600 shadow-inner" />
            </div>

            {/* Card body */}
            <div
              className="rounded-lg shadow-lg p-5 flex flex-col gap-2"
              style={{
                backgroundColor: '#FAF5EE',
                width: '200px',
                minHeight: '160px',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {/* Checkmark icon */}
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#E8F0E6' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="#2D5A27"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3
                className="font-bold leading-tight"
                style={{
                  fontFamily: "'Cooperative', sans-serif",
                  fontSize: '15px',
                  color: '#162E14',
                }}
              >
                {card.title}
              </h3>

              {/* Description */}
              <p
                className="leading-snug"
                style={{
                  fontFamily: "'Discovery', sans-serif",
                  fontSize: '12px',
                  color: '#4A4A4A',
                  lineHeight: 1.5,
                }}
              >
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
