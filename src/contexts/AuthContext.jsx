import { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

function readList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

export const AuthProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setBookmarks(readList('rophim_bookmarks'));
    setHistory(readList('rophim_history'));
  }, []);

  useEffect(() => {
    localStorage.setItem('rophim_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('rophim_history', JSON.stringify(history));
  }, [history]);

  const toggleBookmark = (movie) => {
    setBookmarks(prev => {
      const exists = prev.some(item => item.slug === movie.slug);
      if (exists) return prev.filter(item => item.slug !== movie.slug);
      return [{
        slug: movie.slug,
        name: movie.name,
        thumb_url: movie.thumb_url || movie.poster_url,
        addedAt: new Date().toISOString(),
      }, ...prev];
    });
  };

  const isBookmarked = (slug) => bookmarks.some(item => item.slug === slug);

  const addToHistory = (movie, episodeName) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.slug !== movie.slug);
      return [{
        slug: movie.slug,
        name: movie.name,
        thumb_url: movie.thumb_url || movie.poster_url,
        lastEpisode: episodeName,
        watchedAt: new Date().toISOString(),
      }, ...filtered].slice(0, 50);
    });
  };

  return (
    <AuthContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked, history, addToHistory }}>
      {children}
    </AuthContext.Provider>
  );
};
