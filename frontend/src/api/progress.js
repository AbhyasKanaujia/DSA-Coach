import client from './client';

export async function get() {
  const { data } = await client.get('/progress');
  return data;
}
