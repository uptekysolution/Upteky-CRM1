import Image from 'next/image'
import { useState } from 'react'
import uptekyLogo from '/public/upteky-log.png'

export default function LogoImage({ className = '', alt = 'Upteky logo', size = 128, priority = true }) {
    const [imageError, setImageError] = useState(false)

    if (imageError) {
        return (
            <div 
                className={`flex items-center justify-center bg-gray-100 rounded ${className}`}
                style={{ width: size, height: size }}
            >
                <span className="text-gray-500 text-sm font-medium">Logo</span>
            </div>
        )
    }

    return (
        <Image
            src={uptekyLogo}
            alt={alt}
            width={size}
            height={size}
            sizes={`${size}px`}
            quality={100}
            className={`object-contain ${className}`}
            priority={priority}
            onError={() => setImageError(true)}
        />
    )
}
