import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3000/api';

export const handlers = [
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'bad@x.com') {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    return HttpResponse.json({
      token: 't-fake',
      user: { id: 'u1', name: 'A', email: body.email },
    });
  }),

  http.post(`${BASE_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'dupe@x.com') {
      return HttpResponse.json({ message: 'Email already exists' }, { status: 409 });
    }
    return HttpResponse.json({
      token: 't-fake',
      user: { id: 'u1', name: body.name, email: body.email },
    }, { status: 201 });
  }),

  http.get(`${BASE_URL}/auth/profile`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth !== 'Bearer t-fake') {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({ id: 'u1', name: 'A', email: 'a@x.com' });
  }),
];