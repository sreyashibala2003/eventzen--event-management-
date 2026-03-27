import axios from 'axios';
import config from '../config/index.js';

const authClient = axios.create({
  baseURL: config.services.authService,
  timeout: 5000
});

export const introspectAccessToken = async (token) => {
  const response = await authClient.post(
    '/auth/introspect',
    undefined,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};

export default {
  introspectAccessToken
};
