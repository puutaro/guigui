
export const makeDisplayText = (
    item: string,
    delimiter: string,
    withNth: number,
): string =>{
    const fields = item.split(delimiter);
    if (delimiter == "" || withNth < 0) {
        return item
    }
    return fields[withNth] !== undefined ?
        fields[withNth] :
        item;
}
