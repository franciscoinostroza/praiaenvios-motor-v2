import { migrate } from './migrate.js';
import { seed } from './seed.js';

export async function runSetup() {
  try {
    await migrate();
    await seed();
  } catch (err) {
    console.error('[setup] error:', err.message);
  }
}
