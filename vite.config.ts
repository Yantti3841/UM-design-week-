import { defineConfig } from 'vite';
import { sites } from './scripts/vite/sites-vite-plugin';

export default defineConfig({plugins:[sites({mockAuth:false})]});
