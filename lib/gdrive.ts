/**
 * Convert Google Drive sharing URLs to direct image URLs.
 * Supports:
 *   https://drive.google.com/file/d/FILE_ID/view?...
 *   https://drive.google.com/open?id=FILE_ID
 */
export function toDirectImageUrl(url: string | null | undefined): string {
  if (!url) return "/placeholder.svg";
  
  // Already a direct link or non-Drive URL
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveFileMatch) {
    return `https://drive.google.com/thumbnail?id=${driveFileMatch[1]}&sz=w800`;
  }
  
  const driveOpenMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
  if (driveOpenMatch) {
    return `https://drive.google.com/thumbnail?id=${driveOpenMatch[1]}&sz=w800`;
  }
  
  return url;
}
