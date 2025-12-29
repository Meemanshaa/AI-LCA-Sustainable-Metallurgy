import React, { useEffect, useRef } from 'react';
import { DotLottie } from '@lottiefiles/dotlottie-web';

interface LottieLoaderProps {
  className?: string;
  size?: number;
}

const LottieLoader: React.FC<LottieLoaderProps> = ({ className = '', size = 20 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotLottieRef = useRef<DotLottie | null>(null);

  useEffect(() => {
    if (canvasRef.current && !dotLottieRef.current) {
      dotLottieRef.current = new DotLottie({
        autoplay: true,
        loop: true,
        canvas: canvasRef.current,
        src: "https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie",
      });
    }

    return () => {
      if (dotLottieRef.current) {
        dotLottieRef.current.destroy();
        dotLottieRef.current = null;
      }
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      width={size} 
      height={size}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};

export default LottieLoader;