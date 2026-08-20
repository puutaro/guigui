import {outputLineByExit} from "./libs/outputLineByExit";

export type FilterDisplayProps = {
    listItemRefs:  React.MutableRefObject<(HTMLLIElement | null)[]>;
    filteredListItems: string[];
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    searchQuery: string;
    delimiter: string;
    withNth: number;
    headerLines: number;
    borderValue: number;
}

export const FilterDisplay = (
    {
        listItemRefs,
        filteredListItems,
        setSelectedIndex,
        searchQuery,
        delimiter,
        withNth,
        headerLines,
        borderValue,
    }: FilterDisplayProps
) => {
    return (
        <ul
        className="flex flex-col">
        {filteredListItems.map((item, index) => {
            const isHeader = index < headerLines;
            const fields = item.split(delimiter);
            let displayText = item
            if (delimiter != "" && withNth >= 0) {
                displayText = fields[withNth] !== undefined ?
                    fields[withNth] :
                    item;
            }
            let renderedContent: React.ReactNode = displayText;
            if (!isHeader && searchQuery.length > 0) {
                const lowerSQuery = searchQuery.toLowerCase();
                const lowerDisplayText = displayText.toLowerCase();
                const matchIndices: number[] = [];
                let curIndex = -1;
                let isMatched = true;
                for (const char of lowerSQuery) {
                    const charIndex = lowerDisplayText.indexOf(char, curIndex + 1);
                    if (charIndex <= curIndex || charIndex === -1) {
                        isMatched = false;
                        break;
                    }
                    matchIndices.push(charIndex);
                    curIndex = charIndex;
                }
                if (isMatched && matchIndices.length > 0) {
                    const parts: React.ReactNode[] = [];
                    let lastIdx = 0;
                    matchIndices.forEach((matchIdx, i) => {
                        if (matchIdx > lastIdx) {
                            parts.push(displayText.substring(lastIdx, matchIdx));
                        }
                        parts.push(
                            <strong key={i} className="font-extrabold text-blue-600 bg-blue-50">
                                {displayText.substring(matchIdx, matchIdx + 1)}
                            </strong>
                        );
                        lastIdx = matchIdx + 1;
                    });
                    if (lastIdx < displayText.length) {
                        parts.push(displayText.substring(lastIdx));
                    }
                    renderedContent = <>{parts}</>;
                }
            }
            return (
                <li
                    key={index}
                    tabIndex={isHeader ? -1 : 0}
                    ref={(el) => (listItemRefs.current[index] = el)}
                    className="hover:bg-blue-50 focus:bg-blue-100 focus:outline-none rounded cursor-pointer border-transparent focus:border-blue-400"
                    onClick={() => {
                        if (isHeader) return
                        setSelectedIndex(index);
                        listItemRefs.current[index]?.focus();
                    }}
                    onDoubleClick={() => {
                        if (isHeader) return
                        outputLineByExit(filteredListItems, index);
                    }}
                    style={{
                        padding: `${borderValue}px`,
                        margin: `calc(${borderValue}px /  2)`,
                    }}
                >
                    {renderedContent}
                </li>);
        })}
    </ul>
    )
}