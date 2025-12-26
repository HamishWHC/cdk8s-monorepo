import type { ChartProps } from "cdk8s";

// Represents the class of T, rather than an instance of it.
export type Type<T, A extends unknown[] = unknown[]> = new (...args: A) => T;
// Converts from Type<T> to T.
export type InstanceOf<T> = T extends new (...args: unknown[]) => infer U ? U : never;
// Makes a set of fields on T required.
export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NamespacedChartProps = Require<ChartProps, "namespace">;
