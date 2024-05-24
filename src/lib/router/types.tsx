import { ReactNode } from "react";

export type Routes = {
	[key: string]: Route;
};

export type Route = {
	path: string;
	children?: Routes;
};

export type Param<Segment extends string> = Segment extends `:${infer P}` ? P : never;

export type AllParams<Path extends string> = Path extends `${infer SegmentA}/${infer SegmentB}`
	? Param<SegmentA> | AllParams<SegmentB>
	: Param<Path>;

export type RouteParams<Path extends string> = AllParams<Path> extends never
	? never
	: {
			[Key in AllParams<Path>]: string;
	  };

export type RouteKeys<T> = {
	[K in keyof T]: T[K] extends { children: object }
		? K extends string
			? `${K}` | `${K}.${RouteKeys<T[K]["children"]>}`
			: never
		: K extends string
		? `${K}`
		: never;
}[keyof T];
