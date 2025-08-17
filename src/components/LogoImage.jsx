import Image from 'next/image'

export default function LogoImage({ className = '', alt = 'Upteky logo', size = 128, priority = true }) {
    return (
        <Image
            src="/fontkit-data/upteky-log.png"
            alt={alt}
            width={size}
            height={size}
            sizes={`${size}px`}
            quality={100}
            className={`object-contain ${className}`}
            priority={priority}
        />
    )
}
