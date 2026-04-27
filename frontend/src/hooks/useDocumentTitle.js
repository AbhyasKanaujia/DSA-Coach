import { useEffect } from 'react';

const BASE = '~/dsa_coach';

function toSlug(title) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function useDocumentTitle(title) {
  useEffect(() => {
    const slug = title ? toSlug(title) : '';
    document.title = slug ? `${BASE}/${slug}` : BASE;
  }, [title]);
}
