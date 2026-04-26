import client from './client';

export async function register({ email, password, name }) {
  const { data } = await client.post('/auth/register', { email, password, name });
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await client.post('/auth/login', { email, password });
  return data;
}

export async function getProfile() {
  const { data } = await client.get('/auth/profile');
  return data;
}

export async function updateProfile(patch) {
  const { data } = await client.put('/auth/profile', patch);
  return data;
}
