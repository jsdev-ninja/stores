/**
 * Link.tsx — typed Link and navigate for the custom router, re-backed on
 * React Router v7 (Strategy B).
 *
 * navigate() now drives RR7's history via the module-level ref in store.tsx
 * (populated by RouterBridge).  The public signatures are unchanged.
 */

import { ReactNode } from "react";
import { Route, RouteKeys, RouteParams, Routes } from "../types";
import { replaceParamsInPath } from "../utils";
import { getRouteData } from "../utils/traverse";
import { Link as UiLink, LinkProps } from "@heroui/react";
import type { RouterStore } from "../store";

type TUiLinkProps = Omit<LinkProps, "href">;

export function createLink<T extends Routes>(routes: T, store: RouterStore) {
  type RoutePath<key extends string, T extends Routes> = key extends keyof T
    ? T[key] extends Route
      ? T[key]["path"]
      : never
    : key extends `${infer S}.${infer B}`
    ? S extends keyof T
      ? T[S] extends Route
        ? B extends keyof T[S]["children"]
          ? T[S] extends undefined
            ? never
            : T[S]["children"] extends Routes
            ? RoutePath<B, T[S]["children"]>
            : never
          : never
        : never
      : never
    : never;

  type TTo = RouteKeys<typeof routes>;

  function _navigate({ path, state }: { path: string; state?: unknown }) {
    store.navigate({ path, state });
  }

  type Props<K extends string> =
    RouteParams<RoutePath<K, typeof routes>> extends never
      ? {
          to: K;
          children: ReactNode;
          className?: string;
          state?: unknown;
        }
      : {
          to: K;
          children: ReactNode;
          params: RouteParams<RoutePath<K, typeof routes>>;
          className?: string;
          state?: unknown;
        };

  function Link<K extends TTo>(props: Props<K> & TUiLinkProps) {
    const { to, state, ...rest } = props;
    const routeConfig = getRouteData(to ?? "", routes);

    const p = "params" in props ? props.params : {};

    const path = replaceParamsInPath(routeConfig?.fullPath ?? "", p);

    return (
      <UiLink
        {...rest}
        onPress={() => {
          _navigate({ path, state });
        }}
      />
    );
  }

  function navigate<K extends TTo>(props: {
    to: K;
    state?: unknown;
    params?: RouteParams<RoutePath<K, typeof routes>> extends never
      ? undefined
      : RouteParams<RoutePath<K, typeof routes>>;
  }) {
    const { params, state, to } = props;
    const routeConfig = getRouteData(to, routes);

    const path = replaceParamsInPath(routeConfig?.fullPath ?? "", params);

    _navigate({ path, state });
  }

  return { Link, navigate };
}
