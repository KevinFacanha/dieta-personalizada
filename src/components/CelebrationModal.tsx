import React, { useEffect, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CelebrationModalProps {
  onClose: () => void;
}

function CelebrationModal({ onClose }: CelebrationModalProps) {
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        setShowCloseButton(true);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    // Play celebration sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore audio play errors (some browsers block autoplay)
    });

    // Try to vibrate device
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    return () => {
      clearInterval(interval);
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white rounded-xl p-8 max-w-md w-full mx-4 transform animate-celebration">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <PartyPopper className="w-10 h-10 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 animate-bounce">
            Parabéns!
          </h2>
          <p className="text-gray-600 mb-6">
            Você completou todas as refeições do dia! Continue mantendo seus bons hábitos alimentares!
          </p>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CelebrationModal;