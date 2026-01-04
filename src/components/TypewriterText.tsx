import { useEffect, useState } from 'react';
import { gsap } from 'gsap';

interface TypewriterTextProps {
  text: string;
  className?: string;
  typingSpeed?: number;
  initialDelay?: number;
}

const TypewriterText = ({
  text,
  className = '',
  typingSpeed = 100,
  initialDelay = 0.5,
}: TypewriterTextProps) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const chars = text.split('');
    const delayedCalls: gsap.core.Tween[] = [];
    
    chars.forEach((_, index) => {
      const delay = initialDelay + (index * (typingSpeed / 1000));
      const call = gsap.delayedCall(delay, () => {
        setVisibleCount(index + 1);
      });
      delayedCalls.push(call);
    });

    return () => {
      delayedCalls.forEach(call => call.kill());
    };
  }, [text, typingSpeed, initialDelay]);

  return (
    <span className={className} dir="ltr">
      <span>{text.substring(0, visibleCount)}</span>
      <span className="invisible">{text.substring(visibleCount)}</span>
    </span>
  );
};

export default TypewriterText;
