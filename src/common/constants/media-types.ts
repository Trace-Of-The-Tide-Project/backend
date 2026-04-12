export const IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const AUDIO_MIMES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
];

export const VIDEO_MIMES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
];

export const ALL_MEDIA_MIMES = [...IMAGE_MIMES, ...AUDIO_MIMES, ...VIDEO_MIMES];

export const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500 MB

export type MediaCategory = 'images' | 'audio' | 'videos';

export function getMediaCategory(mime: string): MediaCategory | null {
  if (IMAGE_MIMES.includes(mime)) return 'images';
  if (AUDIO_MIMES.includes(mime)) return 'audio';
  if (VIDEO_MIMES.includes(mime)) return 'videos';
  return null;
}
