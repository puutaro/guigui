import {outputLineByHidden} from "./libs/outputLineByHidden";
import {renderForFilterText} from "../libs/renderForFilterText";

export type FilterDisplayProps = {
    listItemRefs:  React.MutableRefObject<(HTMLLIElement | null)[]>;
    filterItemOpjs: {
        lineKey: string
        nthKey: string
        matchedIndex: number[]
    }[],
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    borderValue: number;
    headerLines: number; // ★ ヘッダー行数を追加
}

export const FilterDisplay = (
    {
        listItemRefs,
        filterItemOpjs,
        setSearchQuery,
        setSelectedIndex,
        borderValue,
        headerLines,
    }: FilterDisplayProps
) => {
    // ボディ用の描画オブジェクトリスト
    const bodyRenderedObjList = renderForFilterText(filterItemOpjs)
    return (
            <ul className="flex flex-col">
                {bodyRenderedObjList.map((obj, bodyIndex) => {
                    // 全体でのインデックス（headerLines分をオフセット）
                    const actualIndex = headerLines + bodyIndex;
                    return (
                        <li
                            key={`body-${bodyIndex}`}
                            tabIndex={0}
                            ref={(el) => (listItemRefs.current[actualIndex] = el)}
                            className="hover:bg-blue-50 focus:bg-blue-100 focus:outline-none rounded cursor-pointer border-transparent focus:border-blue-400"
                            onClick={() => {
                                setSelectedIndex(actualIndex);
                                listItemRefs.current[actualIndex]?.focus();
                            }}
                            onDoubleClick={() => {
                                setSearchQuery("")
                                outputLineByHidden(obj.lineKey ?? "");
                            }}
                            onKeyDown={(e)=>{
                                if (e.key !== 'Enter') return
                                e.preventDefault()
                                setSearchQuery("")
                                outputLineByHidden(obj.lineKey ?? "");
                            }}
                            style={{
                                padding: `${borderValue}px`,
                                margin: `calc(${borderValue}px /  2)`,
                            }}
                        >
                            {obj.renderedContent}
                        </li>
                    );
                })}
            </ul>
    )
}