export type SearchableTexture = { title: string };

export const normalizeSearchText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export const editDistance = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let diagonal = previous[0];
    previous[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const above = previous[rightIndex];
      previous[rightIndex] = left[leftIndex - 1] === right[rightIndex - 1]
        ? diagonal
        : Math.min(diagonal, previous[rightIndex - 1], above) + 1;
      diagonal = above;
    }
  }

  return previous[right.length];
};

export const fuzzyTextureScore = (texture: SearchableTexture, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 0;

  const title = normalizeSearchText(texture.title);
  const words = title.split(" ").filter(Boolean);
  if (title === normalizedQuery) return 0;
  if (title.startsWith(normalizedQuery)) return 1;
  if (title.includes(normalizedQuery)) return 2;

  const queryWords = normalizedQuery.split(" ").filter(Boolean);
  const wordScore = queryWords.reduce((total, queryWord) => {
    const bestWordScore = words.reduce((best, word) => {
      if (word.startsWith(queryWord)) return Math.min(best, 3);
      if (word.includes(queryWord)) return Math.min(best, 4);
      if (queryWord.length >= 3 && editDistance(word, queryWord) <= 2) return Math.min(best, 5);
      return best;
    }, Infinity);

    return total + bestWordScore;
  }, 0);

  if (wordScore !== Infinity && wordScore <= queryWords.length * 5) return 10 + wordScore;

  let queryIndex = 0;
  for (const character of title) {
    if (character === normalizedQuery[queryIndex]) queryIndex += 1;
    if (queryIndex === normalizedQuery.length) return 20 + title.length - normalizedQuery.length;
  }

  return Infinity;
};

export const createRandom = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
};

/** Ranks textures by fuzzy relevance; callers decide whether a blank query should skip ranking. */
export const rankTextures = <T extends { title: string }>(textures: T[], query: string): T[] => (
  textures
    .map((texture) => ({ texture, score: fuzzyTextureScore(texture, query) }))
    .filter(({ score }) => score !== Infinity)
    .sort((left, right) => left.score - right.score || left.texture.title.localeCompare(right.texture.title))
    .map(({ texture }) => texture)
);
