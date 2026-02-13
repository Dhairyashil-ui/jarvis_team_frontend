import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HackathonTimer = ({ durationHours, isActive }) => {
  const [timeLeft, setTimeLeft] = useState(durationHours * 3600); // Convert hours to seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const audioRef = useRef(null);

  // Calculate time components
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  // Play sound effect
  const playSound = (type) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different alerts
      const frequencies = {
        warning: 880, // Higher pitch for warnings
        critical: 440, // Lower pitch for critical
        milestone: 660, // Medium pitch for milestones
        completed: 220  // Low pitch for completion
      };
      
      oscillator.frequency.setValueAtTime(frequencies[type] || 440, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  useEffect(() => {
    if (!isActive || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Warning at 2 hours left
        if (newTime === 2 * 3600 && !isWarning) {
          setIsWarning(true);
          playSound('warning');
        }
        
        // Critical at 1 hour left
        if (newTime === 1 * 3600 && !isCritical) {
          setIsCritical(true);
          playSound('critical');
        }
        
        // Milestone sounds every 6 hours
        if (newTime > 0 && newTime % (6 * 3600) === 0) {
          playSound('milestone');
        }
        
        // End of hackathon
        if (newTime <= 0) {
          clearInterval(timer);
          setIsCompleted(true);
          playSound('completed');
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, isWarning, isCritical, isCompleted]);

  if (!isActive && !isCompleted) return null;

  const getOrbStyle = () => {
    if (isCompleted) return 'from-red-600 to-red-800';
    if (isCritical) return 'from-red-500 to-orange-600';
    if (isWarning) return 'from-yellow-500 to-orange-500';
    return 'from-blue-500 to-purple-600';
  };

  const getTextStyle = () => {
    if (isCompleted) return 'text-red-200';
    if (isCritical) return 'text-red-200';
    if (isWarning) return 'text-yellow-200';
    return 'text-white';
  };

  const getGlowStyle = () => {
    if (isCompleted) return 'shadow-[0_0_30px_rgba(220,38,38,0.5)]';
    if (isCritical) return 'shadow-[0_0_25px_rgba(239,68,68,0.4)]';
    if (isWarning) return 'shadow-[0_0_20px_rgba(245,158,11,0.3)]';
    return 'shadow-[0_0_20px_rgba(59,130,246,0.3)]';
  };

  const getAnimationStyle = () => {
    if (isCritical) return 'animate-pulse';
    if (isWarning) return 'animate-pulse';
    if (isCompleted) return 'animate-pulse';
    return 'animate-pulse-slow';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0, y: 100, x: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0, y: 100, x: 100 }}
        className="fixed bottom-8 right-8 z-[9999] select-none"
      >
        <div className={`${getOrbStyle()} ${getGlowStyle()} ${getAnimationStyle()} rounded-full w-24 h-24 flex items-center justify-center cursor-pointer group transition-all duration-300`}>
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-spin-slow" style={{transform: 'rotateY(0deg)'}}></div>
          
          {/* Main orb content */}
          <div className="relative z-10 text-center">
            <div className={`text-lg font-bold ${getTextStyle()} leading-tight`}>
              {String(hours).padStart(2, '0')}<br/>
              <span className="text-xs font-normal">:</span><br/>
              {String(minutes).padStart(2, '0')}<br/>
              <span className="text-xs font-normal">:</span><br/>
              {String(seconds).padStart(2, '0')}
            </div>
            
            {/* Status indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white">
              <div className={`w-2 h-2 rounded-full mx-auto mt-0.5 ${
                isCompleted ? 'bg-red-500' : 
                isCritical ? 'bg-red-500' : 
                isWarning ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}></div>
            </div>
          </div>
          
          {/* Inner rings for futuristic effect */}
          <div className="absolute inset-2 rounded-full border border-white/30"></div>
          <div className="absolute inset-4 rounded-full border border-white/20"></div>
        </div>
        
        {/* Status label */}
        {(isCritical || isWarning || isCompleted) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded ${
              isCompleted ? 'bg-red-900/80 text-red-200' :
              isCritical ? 'bg-red-900/80 text-red-200' : 
              isWarning ? 'bg-yellow-900/80 text-yellow-200' : 
              'bg-blue-900/80 text-blue-200'
            }`}
          >
            {isCompleted ? 'TIME UP!' : isCritical ? 'CRITICAL!' : isWarning ? 'WARNING' : 'ACTIVE'}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default HackathonTimer;