// Catch-all route: mounts the entire existing <App/> and its hand-rolled router.
// Behavior is identical to today's SPA. Public routes are promoted out of here
// incrementally in later migration steps (see migration plan §13 steps 5–7).
export { default } from "src/app/App";
