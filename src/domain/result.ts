/**
 * A typed channel for expected success or failure.
 *
 * Boundary values (uploads, pasted JSON, stored projects) are parsed into a
 * `Result` instead of throwing, so callers keep partial facts and a meaningful
 * failure reason. Programmer errors still throw.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/** Construct a successful result. */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/** Construct a failed result. */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Map the success channel, preserving the failure untouched. */
export const mapOk = <T, U, E>(result: Result<T, E>, map: (value: T) => U): Result<U, E> =>
  result.ok ? ok(map(result.value)) : result;

/** Collect results, failing on the first error. */
export const allOk = <T, E>(results: readonly Result<T, E>[]): Result<readonly T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (!result.ok) return result;
    values.push(result.value);
  }
  return ok(values);
};
