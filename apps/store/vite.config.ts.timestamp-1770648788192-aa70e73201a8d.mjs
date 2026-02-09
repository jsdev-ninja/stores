// vite.config.ts
import { sentryVitePlugin } from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { defineConfig } from "file:///Users/philbro/workspace/@jsdev-store/node_modules/vite/dist/node/index.js";
import react from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@vitejs/plugin-react-swc/index.mjs";
import tsconfigPaths from "file:///Users/philbro/workspace/@jsdev-store/node_modules/vite-tsconfig-paths/dist/index.mjs";
import legacy from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    legacy({
      polyfills: true
    }),
    react(),
    tsconfigPaths(),
    sentryVitePlugin({
      org: "jsdev-s7",
      project: "stores"
    })
  ],
  resolve: {
    alias: {
      src: "/src"
    }
  },
  build: {
    sourcemap: true
  },
  esbuild: {
    supported: {
      bigint: true
    }
  },
  server: {
    port: 5173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcGhpbGJyby93b3Jrc3BhY2UvQGpzZGV2LXN0b3JlL2FwcHMvc3RvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9waGlsYnJvL3dvcmtzcGFjZS9AanNkZXYtc3RvcmUvYXBwcy9zdG9yZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGhpbGJyby93b3Jrc3BhY2UvQGpzZGV2LXN0b3JlL2FwcHMvc3RvcmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSBcIkBzZW50cnkvdml0ZS1wbHVnaW5cIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcbmltcG9ydCBsZWdhY3kgZnJvbSBcIkB2aXRlanMvcGx1Z2luLWxlZ2FjeVwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcblx0cGx1Z2luczogW1xuXHRcdGxlZ2FjeSh7XG5cdFx0XHRwb2x5ZmlsbHM6IHRydWUsXG5cdFx0fSksXG5cdFx0cmVhY3QoKSxcblx0XHR0c2NvbmZpZ1BhdGhzKCksXG5cdFx0c2VudHJ5Vml0ZVBsdWdpbih7XG5cdFx0XHRvcmc6IFwianNkZXYtczdcIixcblx0XHRcdHByb2plY3Q6IFwic3RvcmVzXCIsXG5cdFx0fSksXG5cdF0sXG5cblx0cmVzb2x2ZToge1xuXHRcdGFsaWFzOiB7XG5cdFx0XHRzcmM6IFwiL3NyY1wiLFxuXHRcdH0sXG5cdH0sXG5cblx0YnVpbGQ6IHtcblx0XHRzb3VyY2VtYXA6IHRydWUsXG5cdH0sXG5cdGVzYnVpbGQ6IHtcblx0XHRzdXBwb3J0ZWQ6IHtcblx0XHRcdGJpZ2ludDogdHJ1ZSxcblx0XHR9LFxuXHR9LFxuXHRzZXJ2ZXI6IHtcblx0XHRwb3J0OiA1MTczLFxuXHR9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtVLFNBQVMsd0JBQXdCO0FBQ25XLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sV0FBVztBQUNsQixPQUFPLG1CQUFtQjtBQUMxQixPQUFPLFlBQVk7QUFHbkIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsU0FBUztBQUFBLElBQ1IsT0FBTztBQUFBLE1BQ04sV0FBVztBQUFBLElBQ1osQ0FBQztBQUFBLElBQ0QsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsaUJBQWlCO0FBQUEsTUFDaEIsS0FBSztBQUFBLE1BQ0wsU0FBUztBQUFBLElBQ1YsQ0FBQztBQUFBLEVBQ0Y7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNSLE9BQU87QUFBQSxNQUNOLEtBQUs7QUFBQSxJQUNOO0FBQUEsRUFDRDtBQUFBLEVBRUEsT0FBTztBQUFBLElBQ04sV0FBVztBQUFBLEVBQ1o7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLFdBQVc7QUFBQSxNQUNWLFFBQVE7QUFBQSxJQUNUO0FBQUEsRUFDRDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ1AsTUFBTTtBQUFBLEVBQ1A7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
