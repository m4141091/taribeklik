import { useState, useEffect } from 'react';

export function useBackgroundImageHeight(imageSrc: string, containerWidth: number) {
  const [height, setHeight] = useState(6000);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const calculatedHeight = Math.round(containerWidth * aspectRatio);
      setHeight(calculatedHeight);
    };
    img.src = imageSrc;
  }, [imageSrc, containerWidth]);

  return height;
}
