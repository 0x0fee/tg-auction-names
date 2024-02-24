import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from "url";
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';



export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            vue({
                template: { transformAssetUrls }
            }),
            quasar({
                sassVariables: 'src/styles/quasar-variables.sass'
            })
        ],
        base: env.VITE_ROOT_PATH,
        server: {
            port: 8080,
        },
        resolve: {
            alias: [
                { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
            ],
        },
    }
})
