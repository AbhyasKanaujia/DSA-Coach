import '@testing-library/jest-dom';
import 'whatwg-fetch';
import axios from 'axios';
import { server } from './server';

axios.defaults.adapter = 'fetch';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());