type IndexedItem = {
  index: number;
};

export function shuffleArray<T extends IndexedItem>(items: T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }

  const unchanged = result.length > 1 && result.every((item, index) => item.index === items[index].index);
  if (unchanged) {
    result.push(result.shift() as T);
  }

  return result;
}
