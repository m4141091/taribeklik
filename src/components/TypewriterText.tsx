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
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const chars = text.split('');
    const delayedCalls: gsap.core.Tween[] = [];
    
    // Create a delayedCall for each character
    chars.forEach((_, index) => {
      const delay = initialDelay + (index * (typingSpeed / 1000));
      const call = gsap.delayedCall(delay, () => {
        setDisplayedText(text.substring(0, index + 1));
      });
      delayedCalls.push(call);
    });

    return () => {
      delayedCalls.forEach(call => call.kill());
    };
  }, [text, typingSpeed, initialDelay]);

  return (
    <span className={className} dir="ltr">
      {displayedText}
    </span>
  );
};

export default TypewriterText;
