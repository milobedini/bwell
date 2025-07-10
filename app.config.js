import 'dotenv/config';

export default {
  expo: {
    name: 'MyApp',
    slug: 'myapp',
    extra: {
      BACKEND_BASE_URL: process.env.BACKEND_BASE_URL
    }
  }
};
