import {outputLineByExit} from "./libs/outputLineByExit";

export type FilterDisplayProps = {
    listItemRefs:  React.MutableRefObject<(HTMLLIElement | null)[]>;
    headerItemObjs: {
        lineKey: string
        nthKey: string
        matchedIndex: number[]
    }[],
    filterItemOpjs: {
        lineKey: string
        nthKey: string
        matchedIndex: number[]
    }[],
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    borderValue: number;
}

export const FilterDisplay = (
    {
        listItemRefs,
        filterItemOpjs,
        headerItemObjs,
        setSelectedIndex,
        borderValue,
    }: FilterDisplayProps
) => {
    const headerRenderedObjList = headerItemObjs.map((obj) => {
        return {
            renderedContent: obj.nthKey,
            lineKey: obj.lineKey,
            isHeader: true,
        }
    })
    const bodyRenderedObjList = filterItemOpjs.map(
        (obj) => {
        let displayText = obj.nthKey
        let renderedContent: React.ReactNode = displayText;
        let matchIndices = obj.matchedIndex
        const isNotHedder = false
        if (matchIndices.length <= 0) return {
            renderedContent: renderedContent,
            lineKey: obj.lineKey,
            isHeader: isNotHedder,
        } ;
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

        return {
            renderedContent: renderedContent,
            lineKey: obj.lineKey,
            isHeader: isNotHedder,
        }
    })
    return (
        <ul
        className="flex flex-col">
        {[...headerRenderedObjList, ...bodyRenderedObjList].map((obj, index) => {
            const isHeader = obj.isHeader;
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
                        outputLineByExit(obj.lineKey ?? "");
                    }}
                    onKeyDown={(e)=>{
                        if(isHeader) return
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        outputLineByExit(
                            obj.lineKey ?? "",
                       );
                    }}
                    style={{
                        padding: `${borderValue}px`,
                        margin: `calc(${borderValue}px /  2)`,
                    }}
                >
                    {obj.renderedContent}
                </li>);
        })}
    </ul>
    )
}
