'use client';

import { useState } from 'react';
import Image from 'next/image';

const NewsImage = ({ src, alt, showFallback }: { src?: string; alt: string; showFallback: boolean }) => {
    const [broken, setBroken] = useState(false);

    // No real photo to show (missing, a reused wire-service logo, or a
    // broken URL) — render nothing rather than a big empty placeholder box.
    // NewsList shows a small inline icon in the meta row instead.
    if (!src || showFallback || broken) {
        return null;
    }

    return (
        <div className="relative h-40 w-full overflow-hidden rounded-md bg-gray-700/50">
            <Image
                src={src}
                alt={alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
                unoptimized
                onError={() => setBroken(true)}
            />
        </div>
    );
};

export default NewsImage;
