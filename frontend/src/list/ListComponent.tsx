import { useEffect, useState, useRef, useMemo } from 'react';
import { list } from '../../wailsjs/go/models'
import { filterListItemObjs } from './filer';
import {onKeyDown} from "./onKeyDown";
import {FilterDisplay} from "./FilterDisplay";
import {makeDisplayText} from "./libs/makeDisplayText";
import {HeaderDisplay} from "./HeaderDisplay";

export type ListComponentProps = {
    listConfig: list.ListConfigResponse | null;
    borderValue: number;
}
export const  ListComponent =
    ({
        listConfig,
        borderValue,
   }: ListComponentProps
) => {
        const searchInputRef = useRef<HTMLInputElement>(null);
        const [listItems, setListItems] = useState<string[]>([]);
        const [searchQuery, setSearchQuery] = useState("");
        const [selectedIndex, setSelectedIndex] = useState(0);
        // 1. 全リストを「ヘッダー部分」と「検索対象のボディ部分」に分割
        const headerLines = listConfig?.headerLines ?? 0;
        useEffect(() => {
          setSelectedIndex(headerLines);
        }, [searchQuery, listConfig?.list, listItems]);

        useEffect(() => {
            setListItems(listConfig?.list ?? []);
        }, [listConfig?.list]);
        const bodyItems = listItems.slice(headerLines);
        // 2. ボディ部分のみに検索クエリの絞り込みを適用
        const delimiter = listConfig?.delimiter ?? ""
        const withNth = listConfig?.withNth ?? -1
        const headerItems = useMemo(
            () => {
            return listItems.slice(0, headerLines)},
            [listConfig?.list, listItems]
        )
        const headerItemObjs = headerItems.map((line) => {
            return {
                lineKey: line,
                nthKey: makeDisplayText(line, delimiter, withNth),
                matchedIndex: [],
            }
        })
        const filteredBodyItemObjs = useMemo(
            () => {
               return filterListItemObjs(
                  bodyItems,
                  searchQuery,
                  delimiter,
                  withNth,
                )}, [searchQuery, listConfig?.list, listItems])
        // 3. ヘッダーと絞り込み済みのボディを常に結合したものを表示用リストとする
        const filteredBodyItems = filteredBodyItemObjs.map((obj) => {
           return obj.lineKey
        })
        const headerAndFilteredBodyListItems = [...headerItems, ...filteredBodyItems];
        // リスト用のDOM要素（li）を格納するための配列参照
        const listItemRefs = useRef<(HTMLLIElement | null)[]>([]);
        // selectedIndex やリストの絞り込み結果が変わったときに、DOMが存在していればフォーカスを当てる
        useEffect(() => {
          // 少しだけタイミングをずらすか、DOMの描画完了を待ってフォーカスする
          requestAnimationFrame(() => {
            const targetListElement = listItemRefs.current[selectedIndex];
            if (!targetListElement) return
            targetListElement.focus();
          });
        }, [selectedIndex, filteredBodyItemObjs]);
            return (
            <div
                id="list-view"
                // className="flex flex-col h-full overflow-hidden w-full"
                className="flex flex-col h-screen overflow-hidden w-full" // ★ h-full を h-screen に変更してみる
                style={{ overscrollBehavior: 'none' }}
                tabIndex={0}
                onKeyDown={(e) => {
                    onKeyDown(
                        e,
                        setListItems,
                        selectedIndex,
                        headerAndFilteredBodyListItems,
                        setSelectedIndex,
                        setSearchQuery,
                        searchInputRef,
                        listConfig?.executes ?? [],
                        listConfig?.execQuits ?? [],
                        listConfig?.reloads ?? [],
                        listConfig?.delimiter || "",
                        headerLines,
                        listConfig?.cycle ?? false,
                    )
                }
                }
            >
            <div
                className="flex-shrink-0 bg-white z-10 w-full flex flex-col box-border"
            >
                {listConfig?.text && (
                    <h1
                        className="font-bold text-blue-900"
                        style={{
                            fontSize: "calc(1em * 110 / 100)",
                            padding: "calc(1em * 110 / 100)",
                        }}
                    >
                        {listConfig.text}
                    </h1>
                )}
                <input
                    ref={searchInputRef} // ★ Refを紐付け
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className=" border-b border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                        switch (true){
                            case (e.key === 'ArrowDown'): {
                                e.preventDefault();
                                e.stopPropagation();
                                if (headerAndFilteredBodyListItems.length > 0) {
                                    const bodyStartIndex = headerLines;
                                    // 確実に一番最初の行（インデックス 0、またはヘッダー考慮なら適切な開始位置）へ
                                    setSelectedIndex(bodyStartIndex);
                                    listItemRefs.current[bodyStartIndex]?.focus();
                                }
                            }
                            break;
                            case (e.key === 'ArrowUp'): {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                            break;
                        }

                    }}
                    style={{
                        padding: `${borderValue}px`,
                        margin: `calc(${borderValue}px /  2)`,
                    }}
                />
                {/* リストのヘッダー行もここで一緒に固定描画 */}
                {headerItemObjs.length > 0 && (
                    <HeaderDisplay
                        listItemRefs={listItemRefs}
                        headerItemObjs={headerItemObjs}
                        borderValue={borderValue}
                    />
                )}
            </div>
            {/* 絞り込み結果を表示するスクロールエリア */}
            <div
                // className="flex-1 overflow-y-auto min-h-0 w-full"
                className="flex-1 h-0 overflow-y-auto w-full"
            >
                {headerAndFilteredBodyListItems.length === headerLines ? (
                    <p className="text-gray-500">No matching items.</p>
                ) : (
                    <FilterDisplay
                        listItemRefs={listItemRefs}
                        filterItemOpjs={filteredBodyItemObjs}
                        setSelectedIndex={setSelectedIndex}
                        borderValue={borderValue}
                        headerLines={headerLines}
                    />
                )}
            </div>
        </div>
    )
}
