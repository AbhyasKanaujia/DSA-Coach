import client from './client';

export async function list({ page = 1, limit = 20 } = {}) {
  const res = await client.get('/collections', { params: { page, limit } });
  const totalHeader = res.headers?.['x-total-count'];
  const total = totalHeader != null ? Number(totalHeader) : null;
  return { items: res.data, total };
}

export async function getById(id) {
  const { data } = await client.get(`/collections/${id}`);
  return data;
}
