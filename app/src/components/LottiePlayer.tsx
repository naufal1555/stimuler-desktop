import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

interface LottiePlayerProps {
  src: string
  loop?: boolean
  autoplay?: boolean
  className?: string
  style?: React.CSSProperties
}

export const LottiePlayer: React.FC<LottiePlayerProps> = ({
  src,
  loop = true,
  autoplay = true,
  className = '',
  style = {}
}) => {
  const [animationData, setAnimationData] = useState<any>(null)

  useEffect(() => {
    let isMounted = true
    fetch(src)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setAnimationData(data)
      })
      .catch((e) => console.warn('Lottie load failed:', src, e))

    return () => {
      isMounted = false
    }
  }, [src])

  if (!animationData) {
    return <div className={`animate-pulse bg-gray-200/50 rounded-lg ${className}`} style={style} />
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoPlay={autoplay}
      className={className}
      style={style}
    />
  )
}
