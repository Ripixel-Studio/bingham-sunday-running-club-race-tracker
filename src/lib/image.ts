/**
 * Shrink a photo before it is committed to the website repo.
 *
 * Phone photos are 4000x3000 / 3-8 MB and carry EXIF (including GPS), and
 * exports from the Instagram image maker can be 20 MB PNGs. The site shows
 * them at most ~1200px wide, so they are scaled down to a sensible long edge
 * and re-encoded as JPEG. Re-encoding through a canvas drops all metadata,
 * so the runners' location never ends up in a public repo.
 */

/** Race photos: the result hero is full content width, cards are smaller. */
export const RACE_PHOTO = { maxEdge: 1920, quality: 0.82 };
/** Runner avatars are shown at a few dozen pixels. */
export const RUNNER_PHOTO = { maxEdge: 640, quality: 0.85 };

export interface PreparedImage {
  blob: Blob;
  width: number;
  height: number;
}

async function decode(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // Applies the EXIF orientation, so a portrait phone shot stays portrait.
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to <img>, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareImage(
  input: Blob,
  opts: { maxEdge: number; quality: number }
): Promise<PreparedImage> {
  const source = await decode(input);
  const srcW = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const srcH = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, opts.maxEdge / Math.max(srcW, srcH));
  const width = Math.round(srcW * scale);
  const height = Math.round(srcH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  // JPEG has no alpha: a transparent PNG would otherwise go black.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  if ('close' in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', opts.quality)
  );
  if (!blob) throw new Error('Could not encode image');
  return { blob, width, height };
}

/**
 * prepareImage, but never fails the save: if the browser cannot decode the
 * file (e.g. HEIC on some devices) the original is uploaded and the website
 * build normalises it.
 */
export async function shrinkForUpload(
  input: Blob,
  opts: { maxEdge: number; quality: number }
): Promise<Blob> {
  try {
    const { blob } = await prepareImage(input, opts);
    return blob;
  } catch (e) {
    console.warn('Image resize failed; uploading the original', e);
    return input;
  }
}

/** Base64 of a blob's bytes, chunked so large files do not blow the stack. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
