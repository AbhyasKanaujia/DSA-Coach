import client from './client';

export async function list() {
  const { data } = await client.get('/library');
  return data;
}

export async function add(collectionId) {
  const { data } = await client.post(`/library/${collectionId}/add`);
  return data;
}

export async function activate(collectionId) {
  const { data } = await client.patch(`/library/${collectionId}/activate`);
  return data;
}

export async function deactivate(collectionId) {
  const { data } = await client.patch(`/library/${collectionId}/deactivate`);
  return data;
}

export async function remove(collectionId) {
  await client.delete(`/library/${collectionId}`);
}
