export function extractErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.error) return data.error;
  if (data.message) return data.message;
  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.map((e) => e.message || e).join(', ');
  }
  return fallback;
}
