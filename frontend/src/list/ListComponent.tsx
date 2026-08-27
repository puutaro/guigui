import { useEffect, useState, useRef, useMemo } from 'react';
import { list } from '../../wailsjs/go/models'
import { filterListItemObjs } from '../libs/filer';
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
        useEffect(() => {
            setSearchQuery("");
        }, [listConfig]);
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
            requestAnimationFrame(() => {
                const targetListElement = listItemRefs.current[selectedIndex];
                if (targetListElement) {
                    // スクロールエリア内に入ってくるよう表示位置だけ調整
                    targetListElement.scrollIntoView({ block: 'nearest' });
                }
                // フォーカスは常に input 要素へ
                searchInputRef.current?.focus();
            });
        }, [selectedIndex, filteredBodyItemObjs]);
        listItemRefs.current = [];
        return (
            <div
                id="list-view"
                // className="flex flex-col h-full overflow-hidden w-full"
                className="flex flex-col h-screen overflow-hidden w-full" // ★ h-full を h-screen に変更してみる
                style={{
                    overscrollBehavior: 'none' ,
                }}
            >
            <div
                className="flex-shrink-0 bg-white z-10 w-full flex flex-col box-border"
            >
                {listConfig?.text && (
                    <h1
                        className="font-bold text-blue-900  whitespace-pre-wrap"
                        style={{
                            fontSize: "calc(1em * 110 / 100)",
                            padding: "calc(1em * 110 / 100)",
                        }}
                    >
                        {listConfig.text}
                    </h1>
                )}
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-b border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    onKeyDown={(e) => {
                        onKeyDown({
                            e,
                            setListItems,
                            selectedIndex,
                            filteredListItems: headerAndFilteredBodyListItems,
                            setSelectedIndex,
                            setSearchQuery,
                            searchInputRef,
                            executes: listConfig?.executes ?? [],
                            execQuit: listConfig?.execQuits ?? [],
                            reloads: listConfig?.reloads ?? [],
                            delimiter: listConfig?.delimiter || "",
                            headerLines,
                            isCycle: listConfig?.cycle ?? false,
                        })
                    }}
                    style={{
                        padding: `${borderValue}px`,
                        margin: `calc(${borderValue}px / 2)`,
                    }}
                />                {/* リストのヘッダー行もここで一緒に固定描画 */}
                {headerItemObjs.length > 0 && (
                    <HeaderDisplay
                        listItemRefs={listItemRefs}
                        headerItemObjs={headerItemObjs}
                        borderValue={borderValue}
                    />
                )}
            </div>
            <div
                className="flex-1 h-0 w-full flex flex-col"
                style={{
                    marginBottom: `calc(${borderValue}px * 2)`, // ★ ここでスクロールエリアの下側に確実にマージンが取れます
                }}
            >
            {/* 絞り込み結果を表示するスクロールエリア */}
            <div
                className="flex-1 h-0 overflow-y-auto w-full"
                style={{
                    // ここでスクロールエリア自体の下側にマージンを取る
                    marginBottom: `${borderValue}px`,
                }}
            >
                {headerAndFilteredBodyListItems.length === headerLines ? (
                    <p className="text-gray-500">No matching items.</p>
                ) : (
                    <FilterDisplay
                        listItemRefs={listItemRefs}
                        filterItemOpjs={filteredBodyItemObjs}
                        setSearchQuery={setSearchQuery}
                        setSelectedIndex={setSelectedIndex}
                        selectedIndex={selectedIndex} // ★ 追加
                        borderValue={borderValue}
                        headerLines={headerLines}
                    />                )}
            </div>
        </div>
        </div>
    )
}
