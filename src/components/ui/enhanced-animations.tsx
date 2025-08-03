import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  duration = 0.3,
  direction = 'up',
  className = ''
}) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'up': return { y: 20, opacity: 0 };
      case 'down': return { y: -20, opacity: 0 };
      case 'left': return { x: 20, opacity: 0 };
      case 'right': return { x: -20, opacity: 0 };
      default: return { y: 20, opacity: 0 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ delay, duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn: React.FC<ScaleInProps> = ({
  children,
  delay = 0,
  duration = 0.3,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

interface SlideInProps {
  children: React.ReactNode;
  direction: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export const SlideIn: React.FC<SlideInProps> = ({
  children,
  direction,
  delay = 0,
  duration = 0.3,
  className = ''
}) => {
  const getInitialPosition = () => {
    const distance = 50;
    switch (direction) {
      case 'left': return { x: -distance };
      case 'right': return { x: distance };
      case 'up': return { y: -distance };
      case 'down': return { y: distance };
    }
  };

  return (
    <motion.div
      className={className}
      initial={getInitialPosition()}
      animate={{ x: 0, y: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

export const StaggerItem: React.FC<StaggerItemProps> = ({
  children,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
          transition: { duration: 0.3, ease: 'easeOut' }
        }
      }}
    >
      {children}
    </motion.div>
  );
};

interface HoverScaleProps {
  children: React.ReactNode;
  scale?: number;
  className?: string;
}

export const HoverScale: React.FC<HoverScaleProps> = ({
  children,
  scale = 1.05,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1,
  className = '',
  prefix = '',
  suffix = ''
}) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const animation = { current: 0 };
    const increment = value / (duration * 60); // 60fps approximation
    
    const timer = setInterval(() => {
      animation.current += increment;
      if (animation.current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(animation.current));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
};

interface ProgressBarProps {
  progress: number;
  duration?: number;
  className?: string;
  showPercentage?: boolean;
}

export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  duration = 1,
  className = '',
  showPercentage = true
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          className="bg-primary h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration, ease: 'easeOut' }}
        />
      </div>
      {showPercentage && (
        <div className="mt-1 text-sm text-muted-foreground">
          <AnimatedCounter value={progress} suffix="%" />
        </div>
      )}
    </div>
  );
};

interface PulseProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export const Pulse: React.FC<PulseProps> = ({
  children,
  scale = 1.1,
  duration = 1,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={{ scale: [1, scale, 1] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
};

interface RotateProps {
  children: React.ReactNode;
  duration?: number;
  className?: string;
}

export const Rotate: React.FC<RotateProps> = ({
  children,
  duration = 2,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={{ rotate: 360 }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      {children}
    </motion.div>
  );
};

interface FloatProps {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  className?: string;
}

export const Float: React.FC<FloatProps> = ({
  children,
  amplitude = 10,
  duration = 3,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={{ y: [-amplitude, amplitude, -amplitude] }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
};

interface ModalAnimationProps {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
}

export const ModalAnimation: React.FC<ModalAnimationProps> = ({
  children,
  isOpen,
  className = ''
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={className}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ListAnimationProps {
  children: React.ReactNode;
  className?: string;
}

export const ListAnimation: React.FC<ListAnimationProps> = ({
  children,
  className = ''
}) => {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        className={className}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};