// vite.config.ts
import { sentryVitePlugin } from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { defineConfig } from "file:///Users/philbro/workspace/@jsdev-store/node_modules/vite/dist/node/index.js";
import { reactRouter } from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@react-router/dev/dist/vite.js";
import tsconfigPaths from "file:///Users/philbro/workspace/@jsdev-store/node_modules/vite-tsconfig-paths/dist/index.mjs";
import legacy from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    legacy({
      polyfills: true
    }),
    reactRouter(),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcGhpbGJyby93b3Jrc3BhY2UvQGpzZGV2LXN0b3JlL2FwcHMvc3RvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9waGlsYnJvL3dvcmtzcGFjZS9AanNkZXYtc3RvcmUvYXBwcy9zdG9yZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGhpbGJyby93b3Jrc3BhY2UvQGpzZGV2LXN0b3JlL2FwcHMvc3RvcmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSBcIkBzZW50cnkvdml0ZS1wbHVnaW5cIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgeyByZWFjdFJvdXRlciB9IGZyb20gXCJAcmVhY3Qtcm91dGVyL2Rldi92aXRlXCI7XG5pbXBvcnQgdHNjb25maWdQYXRocyBmcm9tIFwidml0ZS10c2NvbmZpZy1wYXRoc1wiO1xuaW1wb3J0IGxlZ2FjeSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tbGVnYWN5XCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRwbHVnaW5zOiBbXG5cdFx0bGVnYWN5KHtcblx0XHRcdHBvbHlmaWxsczogdHJ1ZSxcblx0XHR9KSxcblx0XHRyZWFjdFJvdXRlcigpLFxuXHRcdHRzY29uZmlnUGF0aHMoKSxcblx0XHRzZW50cnlWaXRlUGx1Z2luKHtcblx0XHRcdG9yZzogXCJqc2Rldi1zN1wiLFxuXHRcdFx0cHJvamVjdDogXCJzdG9yZXNcIixcblx0XHR9KSxcblx0XSxcblxuXHRyZXNvbHZlOiB7XG5cdFx0YWxpYXM6IHtcblx0XHRcdHNyYzogXCIvc3JjXCIsXG5cdFx0fSxcblx0fSxcblxuXHRidWlsZDoge1xuXHRcdHNvdXJjZW1hcDogdHJ1ZSxcblx0fSxcblx0ZXNidWlsZDoge1xuXHRcdHN1cHBvcnRlZDoge1xuXHRcdFx0YmlnaW50OiB0cnVlLFxuXHRcdH0sXG5cdH0sXG5cdHNlcnZlcjoge1xuXHRcdHBvcnQ6IDUxNzMsXG5cdH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1UsU0FBUyx3QkFBd0I7QUFDblcsU0FBUyxvQkFBb0I7QUFDN0IsU0FBUyxtQkFBbUI7QUFDNUIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxZQUFZO0FBR25CLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzNCLFNBQVM7QUFBQSxJQUNSLE9BQU87QUFBQSxNQUNOLFdBQVc7QUFBQSxJQUNaLENBQUM7QUFBQSxJQUNELFlBQVk7QUFBQSxJQUNaLGNBQWM7QUFBQSxJQUNkLGlCQUFpQjtBQUFBLE1BQ2hCLEtBQUs7QUFBQSxNQUNMLFNBQVM7QUFBQSxJQUNWLENBQUM7QUFBQSxFQUNGO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDUixPQUFPO0FBQUEsTUFDTixLQUFLO0FBQUEsSUFDTjtBQUFBLEVBQ0Q7QUFBQSxFQUVBLE9BQU87QUFBQSxJQUNOLFdBQVc7QUFBQSxFQUNaO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUixXQUFXO0FBQUEsTUFDVixRQUFRO0FBQUEsSUFDVDtBQUFBLEVBQ0Q7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNQLE1BQU07QUFBQSxFQUNQO0FBQ0QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
