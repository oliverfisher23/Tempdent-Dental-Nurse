export const DELIVERY_PHOTO_COPY = {
  reference: 'Item reference photo',
  guidance: 'Use the checks below to record this delivery.',
  source: 'Original photo',
  unavailable: 'This item’s photo could not be loaded. You can still carry out the checks below.',
};

export interface DeliveryPhoto {
  src: string;
  alt: string;
  sourceUrl: string;
  originalUrl: string;
  author: string | null;
  license: string;
  licenseUrl: string | null;
}