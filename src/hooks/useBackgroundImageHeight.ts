import { useState, useEffect } from 'react';

export function useBackgroundImageHeight(imageSrc: string, containerWidth: number, extraPadding: number = 0) {
  const [height, setHeight] = useState(6000);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const calculatedHeight = Math.round(containerWidth * aspectRatio) + extraPadding;
      setHeight(calculatedHeight);
    };
    img.src = imageSrc;
  }, [imageSrc, containerWidth, extraPadding]);

  return height;
}
