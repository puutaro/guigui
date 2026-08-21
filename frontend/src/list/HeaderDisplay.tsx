import {outputLineByExit} from "./libs/outputLineByExit";

export type HeaderDisplayProps = {
    listItemRefs:  React.MutableRefObject<(HTMLLIElement | null)[]>;
    headerItemObjs: {
        lineKey: string
        nthKey: string
        matchedIndex: number[]
    }[],
    borderValue: number;
}

export const HeaderDisplay = (
    {
        listItemRefs,
        headerItemObjs,
        borderValue,
    }: HeaderDisplayProps
) => {
    // ヘッダー用の描画オブジェクトリスト
    const headerRenderedObjList = headerItemObjs.map((obj) => {
        return {
            renderedContent: obj.nthKey,
            lineKey: obj.lineKey,
            isHeader: true,
        }
    });
    return (
        <div className="flex flex-col">
            {/* ★ 固定表示するヘッダー部分 */}
            {headerRenderedObjList.map((obj, index) => {
                return (
                    <li
                        key={`header-${index}`}
                        ref={(el) => (listItemRefs.current[index] = el)}
                        style={{
                            padding: `${borderValue}px`,
                            margin: `calc(${borderValue}px /  2)`,
                        }}
                        className="rounded select-none list-none"
                    >
                        {obj.renderedContent}
                    </li>
                );
            })}
        </div>
    )
}
