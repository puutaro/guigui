import { useEffect, useState, useRef } from 'react';
import { list } from '../../wailsjs/go/models'
import { filterListItems } from './filer';
import {onKeyDown} from "./onKeyDown";
import {FilterDisplay} from "./FilterDisplay";

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
          setSelectedIndex(headerLines);
        }, [searchQuery, listConfig?.list, listItems]);

        useEffect(() => {
            setListItems(listConfig?.list ?? []);
        }, [listConfig?.list]);
        // 1. 全リストを「ヘッダー部分」と「検索対象のボディ部分」に分割
        const headerLines = listConfig?.headerLines ?? 0;
        const headerItems = listItems.slice(0, headerLines);
        const bodyItems = listItems.slice(headerLines);
        // 2. ボディ部分のみに検索クエリの絞り込みを適用
        const filteredBodyItems = filterListItems(
          bodyItems,
          searchQuery,
          listConfig?.delimiter,
          listConfig?.withNth,
        )
        // 3. ヘッダーと絞り込み済みのボディを常に結合したものを表示用リストとする
        const filteredListItems = [...headerItems, ...filteredBodyItems];
        // selectedIndex やリストの絞り込み結果が変わったときに、DOMが存在していればフォーカスを当てる
        useEffect(() => {
          // 少しだけタイミングをずらすか、DOMの描画完了を待ってフォーカスする
          requestAnimationFrame(() => {
            const targetListElement = listItemRefs.current[selectedIndex];
            if (!targetListElement) return
            targetListElement.focus();
          });
        }, [selectedIndex, filteredListItems]);

        // リスト用のDOM要素（li）を格納するための配列参照
        const listItemRefs = useRef<(HTMLLIElement | null)[]>([]);

            return (
                <div
                    id="list-view"
                    className="flex flex-col"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        onKeyDown(
                            e,
                            setListItems,
                            selectedIndex,
                            filteredListItems,
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
                        if (
                            e.key === 'ArrowDown' ||
                            e.key === 'ArrowUp'
                        ) {
                            e.preventDefault();
                            const bodyStartIndex = headerLines;
                            if (filteredListItems.length > bodyStartIndex) {
                                // 最初のデータ行（ボディの先頭）にフォーカスを当てる
                                setSelectedIndex(bodyStartIndex);
                                listItemRefs.current[bodyStartIndex]?.focus();
                            }
                        }
                    }}
                    style={{
                        padding: `${borderValue}px`,
                        margin: `calc(${borderValue}px /  2)`,
                    }}
                />
                {/* 絞り込み結果を表示するスクロールエリア */}
                <div className="rounded max-h-[60vh] overflow-y-auto">
                    {filteredListItems.length === 0 ? (
                        <p className="text-gray-500">No matching items.</p>
                    ) : (
                        <FilterDisplay
                            listItemRefs={listItemRefs}
                            filteredListItems={filteredListItems}
                            setSelectedIndex={setSelectedIndex}
                            searchQuery={searchQuery}
                            delimiter={listConfig?.delimiter ??""}
                            withNth={listConfig?.withNth ?? -1}
                            headerLines={headerLines}
                            borderValue={borderValue}
                        />
                    )}
                </div>
            </div>
        )
}
