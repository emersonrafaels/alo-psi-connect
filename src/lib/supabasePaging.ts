// Supabase returns at most 1000 rows per request; these helpers page past it
// and split large `.in()` filters into chunks to keep URLs short.
const PAGE = 1000;

export async function fetchAllPaged<T = any>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export async function fetchInChunks<T = any>(
  ids: string[],
  build: (chunk: string[], from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  chunkSize = 150,
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    out.push(...(await fetchAllPaged<T>((f, t) => build(chunk, f, t))));
  }
  return out;
}
