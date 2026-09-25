import { useEffect } from 'react';
import { SITE } from '../data/site';

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} - ${SITE.name}` : `${SITE.name} - Fresh Flowers & Bouquets`;
  }, [title]);
}
