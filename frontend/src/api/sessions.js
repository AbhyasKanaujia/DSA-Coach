import client from './client';

export async function start(options = {}) {
  const { data } = await client.post('/sessions/start', options);
  return data;
}

export async function list({ page, limit } = {}) {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  const { data } = await client.get('/sessions', { params });
  return data;
}

export async function getById(id) {
  const { data } = await client.get(`/sessions/${id}`);
  return data;
}

export async function complete(id) {
  const { data } = await client.post(`/sessions/${id}/complete`);
  return data;
}

export async function abandon(id) {
  const { data } = await client.post(`/sessions/${id}/abandon`);
  return data;
}
