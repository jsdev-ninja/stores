/**
 * store.tsx — custom router state store, re-backed on React Router v7.
 *
 * Strategy B: the store now READS location from RR7's useLocation() (via a
 * module-level ref populated by RouterBridge below) and WRITES location via
 * RR7's useNavigate() so RR7 remains the single source of truth for history.
 *
 * Render-safety: no browser globals are read at module load.  All window/
 * history/document access is guarded by "typeof window !== 'undefined'".
 *
 * The store's public surface is unchanged — the same createStore() function
 * returns the same shape — so router.tsx and all call sites keep compiling.
 */

import { useSyncExternalStore, useEffect } from "react";
import { useNavigate, useLocation as useRRLocation } from "react-router";
import { Routes } from "./types";

// ---------------------------------------------------------------------------
// Module-level navigate ref — populated by <RouterBridge/> which must be
// mounted once near the app root (inside <HydratedRouter>).
// ---------------------------------------------------------------------------

type NavigateFn = (path: string, state?: unknown) => void;

let _navigate: NavigateFn | null = null;

// ---------------------------------------------------------------------------
// Listener list — shared across store instances
// ---------------------------------------------------------------------------

let listeners: (() => void)[] = [];

// ---------------------------------------------------------------------------
// RouterStore type — returned by createStore(), consumed by router.tsx
// ---------------------------------------------------------------------------

export interface RouterStore {
  state: {
    pathname: string;
    currentRoute: unknown;
    activeRoutes: Record<string, unknown>;
  };
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => RouterStore["state"];
  navigate: (args: { path: string; state?: unknown }) => void;
  /** Called by RouterBridge whenever RR7's pathname changes. */
  syncPathname: (pathname: string) => void;
  useRouterStore: () => RouterStore["state"];
}

// ---------------------------------------------------------------------------
// RouterBridge — mount once inside the React Router tree (e.g. at the top of
// <App/>). Captures RR7's navigate + location and wires them into the custom
// store so:
//   - standalone navigate() (used at 57+ call sites) drives RR7 history
//   - <Route name="..."> renders based on RR7's current pathname
// ---------------------------------------------------------------------------

export function RouterBridge({ store }: { store: RouterStore }) {
  const rrNavigate = useNavigate();
  const rrLocation = useRRLocation();

  // Wire the module-level navigate ref to RR7's navigate.
  useEffect(() => {
    _navigate = (path: string, state?: unknown) => {
      rrNavigate(path, { state });
    };
    return () => {
      _navigate = null;
    };
  }, [rrNavigate]);

  // Keep the custom store's pathname in sync with RR7 whenever it changes.
  // Handles RR7-initiated navigations (browser back/forward, <Link>, etc.)
  // flowing back into the custom store so <Route name="..."> re-renders.
  useEffect(() => {
    store.syncPathname(rrLocation.pathname);
  }, [rrLocation.pathname, store]);

  return null;
}

// ---------------------------------------------------------------------------
// createStore — same signature as before; now RR7-backed for navigation.
// ---------------------------------------------------------------------------

export function createStore(routes: Routes): RouterStore {
  // Render-safe initial pathname: undefined during build/SSR → default "/".
  const initialPathname =
    typeof window !== "undefined" ? window.location.pathname : "/";

  let routerState: RouterStore["state"] = {
    currentRoute: getRouteFromPath(routes, initialPathname),
    pathname: initialPathname,
    activeRoutes: resolveActiveRoutes(routes, initialPathname),
  };

  const subscribe = (listener: () => void) => {
    listeners = [...listeners, listener];
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  };

  /**
   * navigate — drives RR7's history if RouterBridge is mounted; falls back to
   * raw history.pushState for early calls (pre-hydration) so nothing breaks
   * during the brief window before RouterBridge mounts.
   */
  const navigate = ({ path, state }: { path: string; state?: unknown }) => {
    if (_navigate) {
      _navigate(path, state);
    } else if (typeof history !== "undefined") {
      history.pushState(state ?? {}, "", path);
      updateStore(path);
    }
  };

  const syncPathname = (pathname: string) => {
    if (routerState.pathname !== pathname) {
      updateStore(pathname);
    }
  };

  function updateStore(path: string) {
    routerState = {
      pathname: path,
      currentRoute: getRouteFromPath(routes, path),
      activeRoutes: resolveActiveRoutes(routes, path),
    };
    update();
  }

  const getSnapshot = () => routerState;

  // Render-safe popstate listener — fallback for pre-RouterBridge navigations.
  if (typeof window !== "undefined") {
    window.addEventListener("popstate", function () {
      const path = window.location.pathname;
      updateStore(path);
    });
  }

  return {
    state: routerState,
    subscribe,
    getSnapshot,
    navigate,
    syncPathname,
    useRouterStore: () =>
      useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function update() {
  if (typeof document === "undefined" || !document.startViewTransition) {
    return emitChange();
  }
  const transition = document.startViewTransition(() => {
    emitChange();
  });
  // Intentionally not awaiting — view transition runs async.
  transition.finished.then(() => {}).catch(() => {});
}

function getRouteFromPath(routes: Routes, path: string) {
  return Object.values(routes).find((route) => route.path === path);
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function resolveActiveRoutes(
  routes: Routes,
  path: string,
  prefix = ""
): Record<string, unknown> {
  let activeRoutes: Record<string, unknown> = {};

  const segments = path.split("/").slice(1);
  const _routes = structuredClone(routes);

  Object.entries(_routes).forEach(([name, route]) => {
    let isActive = false;
    const routesSegments = route.path.split("/").slice(1);
    const fullName = prefix ? `${prefix}.${name}` : name;

    if (routesSegments.length !== segments.length && !route.children) {
      isActive = false;
    } else if (routesSegments.length !== segments.length && route.children) {
      const activeRoutesChildren = resolveActiveRoutes(
        route.children,
        path.replace(route.path, ""),
        name
      );
      activeRoutes = {
        ...activeRoutes,
        ...activeRoutesChildren,
        [fullName]: route,
      };
    } else {
      isActive = routesSegments.every(
        (routesSegment, index) =>
          routesSegment.startsWith(":") || routesSegment === segments[index]
      );
    }

    if (isActive) {
      activeRoutes[fullName] = route;
    }
  });

  return activeRoutes;
}
