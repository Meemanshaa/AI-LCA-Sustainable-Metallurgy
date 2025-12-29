import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface GlobalLoaderProps {
  isLoading: boolean;
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-background/80 backdrop-blur-sm border-b">
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-3 bg-card px-6 py-3 rounded-full shadow-lg border">
          <DotLottieReact
            src="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie"
            loop
            autoplay
            style={{ width: '24px', height: '24px' }}
          />
          <span className="text-sm font-medium text-foreground">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;