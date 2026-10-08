/** Match the tokenizer in Discovery's search-functions.sql. Keep C#, C++ and Node.js intact. */
export function getSearchWords(value: string): string[] {
  return [...new Set(value.toLowerCase().split(/[^\p{L}\p{N}#+.]+/u)
    .map((word) => word.replace(/^\.+|\.+$/g, ""))
    .filter((word) => /[\p{L}\p{N}]/u.test(word)))];
}

/** Suggestions accept partial words as the user types, with any-word matching. */
export function matchesAnySearchWord(value: string, query: string): boolean {
  const queryWords = getSearchWords(query);
  if (!queryWords.length) return true;
  const valueWords = getSearchWords(value);
  return queryWords.some((queryWord) => valueWords.some((word) => word.includes(queryWord)));
}
