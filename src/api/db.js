/** Unwraps a Supabase query result, throwing on error and returning data. */
export function throwOnError({ data, error }) {
  if (error) throw error;
  return data;
}
