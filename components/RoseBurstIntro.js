import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import styles from '../styles/Home.module.css';

/**
 * RoseBurstIntro Component
 * 
 * An animated intro overlay that shows a spinning, bursting rose.
 * Originally used on the homepage, extracted to a reusable component.
 * 
 * Usage:
 * <RoseBurstIntro onComplete={() => setShowIntro(false)} />
 */
export default function RoseBurstIntro({ onComplete }) {
  const [showRose, setShowRose] = useState(true);
  const [isBursting, setIsBursting] = useState(false);

  useEffect(() => {
    const burstTimer = setTimeout(() => {
      setIsBursting(true);
    }, 2000);

    const removeTimer = setTimeout(() => {
      setShowRose(false);
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(burstTimer);
      clearTimeout(removeTimer);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {showRose && (
        <motion.div
          className={styles.roseBurstOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.roseBurstContainer}>
            <motion.div
              className={styles.mainRose}
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={
                isBursting
                  ? {
                    scale: [1, 1.3, 0],
                    rotate: [0, 180, 360],
                    opacity: [1, 0.8, 0],
                  }
                  : {
                    scale: 1,
                    rotate: 0,
                    opacity: 1,
                    y: [0, -20, 0],
                  }
              }
              transition={
                isBursting
                  ? { duration: 0.8, ease: "easeOut" }
                  : {
                    scale: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                    rotate: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
                    opacity: { duration: 0.8 },
                    y: { duration: 1.5, ease: "easeInOut" },
                  }
              }
            >
              <Image
                src="/rose.webp"
                alt="Crochet Rose"
                width={200}
                height={200}
                className={styles.roseMainImage}
                priority
                quality={85}
                unoptimized
              />
              <motion.div
                className={styles.roseGlow}
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
