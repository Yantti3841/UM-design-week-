import { defineConfig } from 'vite';
import { sites } from './scripts/vite/sites-vite-plugin';
import { shareTitles } from './scripts/vite/share-titles.js';

export default defineConfig({plugins:[sites({mockAuth:false}),shareTitles()]});
