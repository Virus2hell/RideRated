import { app } from './app.js';
import { env } from './config/env.js';
import { ensureBucket } from './middleware/upload.js';

// Log unexpected async errors instead of letting them silently kill the server.
process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
});

ensureBucket().catch((err) => console.error('Storage check failed:', err.message));

app.listen(env.PORT, () => {
  console.log(`RideRated API listening on http://localhost:${env.PORT}`);
});
