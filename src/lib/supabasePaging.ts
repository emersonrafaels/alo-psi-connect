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
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) chunks.push(ids.slice(i, i + chunkSize));
  // Run up to 4 chunks concurrently; keep result order stable.
  const results: T[][] = new Array(chunks.length);
  let next = 0;
  const worker = async () => {
    while (next < chunks.length) {
      const idx = next++;
      results[idx] = await fetchAllPaged<T>((f, t) => build(chunks[idx], f, t));
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, chunks.length) }, worker));
  return results.flat();
}
