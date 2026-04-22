'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface TimAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export function TimAvatar({ size = 'md', animated = false }: TimAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-tim-accent/80 to-primary/60 flex items-center justify-center text-white font-bold text-sm shadow-sm`}
      variants={variants}
      initial={animated ? 'initial' : false}
      animate={animated ? 'animate' : false}
      transition={{ duration: 0.3 }}
    >
      T
    </motion.div>
  )
}
