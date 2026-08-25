
export const getSafeSelectedItem = <T>(
    items: T[],
    index: number
): T | undefined => {
    if (!items || items.length === 0) return undefined;
    const safeIndex = Math.max(0, Math.min(index, items.length - 1));
    return items[safeIndex];
};