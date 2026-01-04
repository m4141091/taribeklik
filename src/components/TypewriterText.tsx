import { useEffect, useRef, useState } from 'react';
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
  typingSpeed = 80,
  initialDelay = 0.5,
}: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const chars = text.split('');
    
    const tl = gsap.timeline({ delay: initialDelay });
    
    chars.forEach((_, index) => {
      tl.call(() => {
        setDisplayedText(text.substring(0, index + 1));
      }, [], index * (typingSpeed / 1000));
    });

    return () => {
      tl.kill();
    };
  }, [text, typingSpeed, initialDelay]);

  return (
    <span className={className} dir="ltr">
      {displayedText}
    </span>
  );
};

export default TypewriterText;
