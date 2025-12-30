import type { Awaitable } from "./awaitable";

export type Thunk<Ctx, T> = T | ((ctx: Ctx) => Awaitable<T>);

export async function resolveThunk<Ctx, T>(thunk: Thunk<Ctx, T>, ctx: Ctx): Promise<T> {
	if (thunk instanceof Function) {
		return await thunk(ctx);
	}
	return thunk;
}
