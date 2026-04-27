import client from './client';

export async function getById(id) {
  const { data } = await client.get(`/problems/${id}`);
  return data;
}
