import { useState } from 'react';
import { DELIVERY_PHOTO_COPY as COPY, type DeliveryPhoto } from '@/content/delivery-photo-copy';

export function DeliveryItemPhoto({ photo }: { photo: DeliveryPhoto }) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="overflow-hidden rounded border border-gray-700 bg-gray-900" data-testid="delivery-item-photo">
      <div className="aspect-[16/10] w-full bg-[#f3f3f0]">
        {failed ? (
          <p role="status" className="flex h-full items-center px-6 text-sm text-gray-700">{COPY.unavailable}</p>
        ) : (
          <img
            src={photo.src}
            alt={photo.alt}
            className="h-full w-full object-contain"
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption className="space-y-1.5 px-3 py-2.5 text-xs leading-relaxed text-gray-400">
        <p><span className="font-medium text-gray-200">{COPY.reference}.</span> {COPY.guidance}</p>
        <p>
          <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">{photo.author || COPY.source}</a>
          {' · '}
          {photo.licenseUrl ? (
            <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{photo.license}</a>
          ) : <span>{photo.license}</span>}
        </p>
      </figcaption>
    </figure>
  );
}