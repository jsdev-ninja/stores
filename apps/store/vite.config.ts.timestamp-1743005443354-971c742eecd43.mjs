// vite.config.ts
import { sentryVitePlugin } from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { defineConfig } from "file:///Users/philbro/workspace/@jsdev-store/node_modules/vite/dist/node/index.js";
import react from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@vitejs/plugin-react-swc/index.mjs";
import tsconfigPaths from "file:///Users/philbro/workspace/@jsdev-store/node_modules/vite-tsconfig-paths/dist/index.mjs";
import legacy from "file:///Users/philbro/workspace/@jsdev-store/node_modules/@vitejs/plugin-legacy/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [
    legacy({ polyfills: true }),
    react(),
    tsconfigPaths(),
    sentryVitePlugin({
      org: "jsdev-s7",
      project: "javascript-react"
    })
  ],
  resolve: {
    alias: {
      src: "/src"
    }
  },
  build: {
    sourcemap: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcGhpbGJyby93b3Jrc3BhY2UvQGpzZGV2LXN0b3JlL2FwcHMvc3RvcmVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9waGlsYnJvL3dvcmtzcGFjZS9AanNkZXYtc3RvcmUvYXBwcy9zdG9yZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvcGhpbGJyby93b3Jrc3BhY2UvQGpzZGV2LXN0b3JlL2FwcHMvc3RvcmUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzZW50cnlWaXRlUGx1Z2luIH0gZnJvbSBcIkBzZW50cnkvdml0ZS1wbHVnaW5cIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcbmltcG9ydCBsZWdhY3kgZnJvbSBcIkB2aXRlanMvcGx1Z2luLWxlZ2FjeVwiO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcblx0cGx1Z2luczogW1xuXHRcdGxlZ2FjeSh7IHBvbHlmaWxsczogdHJ1ZSB9KSxcblx0XHRyZWFjdCgpLFxuXHRcdHRzY29uZmlnUGF0aHMoKSxcblx0XHRzZW50cnlWaXRlUGx1Z2luKHtcblx0XHRcdG9yZzogXCJqc2Rldi1zN1wiLFxuXHRcdFx0cHJvamVjdDogXCJqYXZhc2NyaXB0LXJlYWN0XCIsXG5cdFx0fSksXG5cdF0sXG5cblx0cmVzb2x2ZToge1xuXHRcdGFsaWFzOiB7XG5cdFx0XHRzcmM6IFwiL3NyY1wiLFxuXHRcdH0sXG5cdH0sXG5cblx0YnVpbGQ6IHtcblx0XHRzb3VyY2VtYXA6IHRydWUsXG5cdH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1UsU0FBUyx3QkFBd0I7QUFDblcsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sWUFBWTtBQUduQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMzQixTQUFTO0FBQUEsSUFDUixPQUFPLEVBQUUsV0FBVyxLQUFLLENBQUM7QUFBQSxJQUMxQixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxpQkFBaUI7QUFBQSxNQUNoQixLQUFLO0FBQUEsTUFDTCxTQUFTO0FBQUEsSUFDVixDQUFDO0FBQUEsRUFDRjtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1IsT0FBTztBQUFBLE1BQ04sS0FBSztBQUFBLElBQ047QUFBQSxFQUNEO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTixXQUFXO0FBQUEsRUFDWjtBQUNELENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
