const TMDB_API_KEY = '051675f9cf39c424859f3e0aa5fcfd85'; // Standard free public key often used by movie clones
const BASE_URL = 'https://api.themoviedb.org/3';

/**
 * Fetch extended credits (cast and crew) for a TMDB movie ID
 */
export async function getTMDBMovieCredits(tmdbId) {
  if (!tmdbId) return null;
  try {
    const res = await fetch(`${BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=vi-VN`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('TMDB Fetch Error (Credits):', err);
    return null;
  }
}

/**
 * Fetch detailed TMDB info including videos (Trailers)
 */
export async function getTMDBMovieDetails(tmdbId) {
  if (!tmdbId) return null;
  try {
    const res = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=videos&language=vi-VN`);
    if (!res.ok) {
      // Fallback to en-US if vi-VN has no data (often true for videos)
      const fallback = await fetch(`${BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=videos&language=en-US`);
      if (!fallback.ok) return null;
      return await fallback.json();
    }
    const data = await res.json();
    
    // Check if we got videos in vietnamese, if not, fetch english videos separately
    if (!data.videos?.results?.length) {
      const vidRes = await fetch(`${BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=en-US`);
      if (vidRes.ok) {
        const vidData = await vidRes.json();
        data.videos = vidData;
      }
    }
    
    return data;
  } catch (err) {
    console.error('TMDB Fetch Error (Details):', err);
    return null;
  }
}

/**
 * Construct TMDB Image URL
 */
export function getTMDBImageUrl(path, size = 'w500') {
  if (!path) return 'https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image';
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
