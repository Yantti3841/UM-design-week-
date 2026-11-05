import { defineConfig } from 'vite';
import { shareTitles } from './scripts/vite/share-titles.js';

export default defineConfig({plugins:[shareTitles()]});
