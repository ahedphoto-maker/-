import { useState, useEffect } from 'react';

export const parseHashPath = () => {
  if (typeof window === 'undefined') return { fullPath: '/', primaryRoute: '/', subRoute: 'dashboard' };

  let rawPath = window.location.hash.replace('#', '') || '';
  if (!rawPath && window.location.pathname && window.location.pathname !== '/') {
    rawPath = window.location.pathname;
  }

  const search = (window.location.search || '').toLowerCase();

  // Route normalization
  if (!rawPath && (search.includes('role=employee') || search.includes('employee=true'))) {
    rawPath = '/employee/dashboard';
  } else if (!rawPath && (search.includes('role=admin') || search.includes('admin=true'))) {
    rawPath = '/admin/dashboard';
  } else if (!rawPath) {
    rawPath = '/';
  }

  const hashParts = rawPath.split('?');
  const pathPart = hashParts[0] || '';
  const queryPart = hashParts[1] || '';

  // Ensure leading slash
  const cleanPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  const parts = cleanPath.split('/').filter(Boolean);

  let primaryRoute = parts[0] ? `/${parts[0]}` : '/';
  let subRoute = parts[1] || 'dashboard';

  // Route Aliases
  if (primaryRoute === '/team' || primaryRoute === '/photographers' || primaryRoute === '/employee') {
    primaryRoute = '/employee';
  }

  const queryParams = {};
  if (queryPart) {
    queryPart.split('&').forEach(pair => {
      const [key, val] = pair.split('=');
      if (key) queryParams[decodeURIComponent(key)] = decodeURIComponent(val || '');
    });
  }

  return {
    fullPath: cleanPath,
    primaryRoute,
    subRoute,
    queryParams,
    parts
  };
};

export const navigateTo = (path) => {
  if (typeof window === 'undefined') return;
  const targetHash = path.startsWith('/') ? `#${path}` : `#/${path}`;
  window.location.hash = targetHash;
};

export const useRoute = () => {
  const [routeInfo, setRouteInfo] = useState(parseHashPath());

  useEffect(() => {
    const handleLocationChange = () => {
      setRouteInfo(parseHashPath());
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  return [routeInfo, navigateTo];
};
