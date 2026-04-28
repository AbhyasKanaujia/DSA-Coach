import client from './client';

export async function submit({ problemId, quality, sessionId }) {
  const { data } = await client.post('/reviews', { problemId, quality, sessionId });
  return data;
}
