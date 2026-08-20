import { list } from '../../wailsjs/go/models'
import {
    RunReloadCmdForList,
    RunCmdForList,
    RunCmdByQuitForList,
    WriteStderr, WriteStdout, ExitWithNumber,
} from '../../wailsjs/go/main/App';

export type ListComponentProps = {
    listConfig: list.ListConfigResponse | null;
    setListItems: React.Dispatch<React.SetStateAction<string[]>>;
    listItemRefs: React.MutableRefObject<(HTMLLIElement | null)[]>;
    filteredListItems: string[];
    selectedIndex: number;
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    searchQuery: string,
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    searchInputRef: React.RefObject<HTMLInputElement>;
    headerLines: number;
    borderValue: number;
}
export const  ListComponent =
    ({
        listConfig,
        setListItems,
        listItemRefs,
        filteredListItems,
        selectedIndex,
        setSelectedIndex,
        searchQuery,
        setSearchQuery,
        searchInputRef,
        headerLines,
        borderValue,
   }: ListComponentProps
) => {
        const outputLineByExit =
            async(filteredListItems: string[], selectedIndex: number) => {
                const selectedItem = filteredListItems[selectedIndex];
                if (!selectedItem) return
                try {
                    await WriteStdout(selectedItem);
                    await ExitWithNumber(0);
                } catch (err) {
                    console.error("Failed to output selected item:", err);
                }
            };
            return (
                <div
                    id="list-view"
                    className="flex flex-col"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        const isAltActive = e.altKey;
                        const isModifierKey = ['Alt', 'Shift', 'Control', 'Enter', 'Tab', ' '].includes(e.key);
                        if (isAltActive && !isModifierKey) {
                            const pressedKey =
                                (e.code.startsWith('Key') &&
                                    e.code.length === 4
                                ) ? e.code.charAt(3).toLowerCase()
                                    : e.key.toLowerCase();
                            const matchedExecute =
                                listConfig?.executes.find(
                                    r => r.key.toLowerCase() === pressedKey);
                            if (matchedExecute) {
                                e.preventDefault();
                                const selectedItem = filteredListItems[selectedIndex];
                                RunCmdForList(
                                    matchedExecute.shell,
                                    selectedItem,
                                    listConfig?.delimiter ?? "",
                                );
                                return
                            }
                            const matchedExecQuit =
                                listConfig?.execQuits.find(
                                    r => r.key.toLowerCase() === pressedKey);
                            if (matchedExecQuit) {
                                e.preventDefault();
                                const selectedItem = filteredListItems[selectedIndex];
                                RunCmdByQuitForList(
                                    matchedExecQuit.shell,
                                    selectedItem,
                                    listConfig?.delimiter ?? "",
                                    matchedExecQuit.exitCode,
                                );
                                return
                            }
                            // getListConfig で取得したデータ（またはスコープ内の変数）から直接探す
                            const matchedReload =
                                listConfig?.reloads.find(
                                    r => r.key.toLowerCase() === pressedKey);
                            if (matchedReload) {
                                e.preventDefault();
                                const selectedItem = filteredListItems[selectedIndex];
                                RunReloadCmdForList(
                                    matchedReload.shell,
                                    selectedItem,
                                    listConfig?.delimiter ?? "",
                                ).then((res) => {
                                    setListItems(res.split("\n"))
                                });
                                return
                            }
                        }
                        if (filteredListItems.length === 0) return;
                        switch (true) {
                            case (e.key === 'ArrowDown'): {
                                e.preventDefault();
                                const headerLines = listConfig?.headerLines ?? 0;
                                const isCycle = listConfig?.cycle ?? false;
                                setSelectedIndex((prev) => {
                                    // ボディ部分が存在しない場合はそのまま
                                    if (filteredListItems.length <= headerLines) return prev;
                                    if (prev < filteredListItems.length - 1) {
                                        return prev + 1;
                                    } else {
                                        // 一番下にいるとき
                                        return isCycle ? headerLines : prev; // cycle が true なら選択可能な最初の行へ
                                    }
                                })
                            }
                            break;
                            case (e.key === 'ArrowUp'): {
                                e.preventDefault();
                                // headerLines 未満には上がらないようにする（最小でも headerLines まで）
                                const headerLines = listConfig?.headerLines ?? 0;
                                const isCycle = listConfig?.cycle ?? false;

                                setSelectedIndex((prev) => {
                                    // ボディ部分が存在しない場合、あるいはヘッダー行にいる場合はそのまま
                                    if (filteredListItems.length <= headerLines || prev <= headerLines) {
                                        return isCycle && filteredListItems.length > headerLines
                                            ? filteredListItems.length - 1 // 選択可能な一番上にいるときに上を押したら最後の行へ
                                            : prev;
                                    }
                                    return prev - 1;
                                });
                            }
                            break;
                            case (e.key === 'Enter'): {
                                e.preventDefault();
                                outputLineByExit(filteredListItems, selectedIndex);
                            }
                            break;
                            case (
                                (e.key.length === 1
                                    && !e.ctrlKey
                                    && !e.metaKey
                                    && !e.altKey) ||
                                e.key === 'Backspace' ||
                                e.key === 'Delete'
                            ): {
                                // ★ リストにフォーカスがある状態で文字キーが押されたら、
                                // 瞬時に検索窓にフォーカスを戻し、入力を邪魔しないようにする
                                e.preventDefault();
                                searchInputRef.current?.focus();
                                switch (true) {
                                    case e.key === 'Backspace': {
                                        // Backspaceの場合は検索クエリの末尾を1文字削る
                                        setSearchQuery(prev => prev.slice(0, -1));
                                    }
                                        break;
                                    case (e.key === 'Delete'): {
                                        // Deleteの場合は必要に応じて全クリアにするか、何もしないなどをお好みで設定できます
                                        // 今回はBackspaceと同様に末尾を削る動作にしておくと自然です
                                        setSearchQuery(prev => prev.slice(0, -1));
                                    }
                                        break;
                                    default: {
                                        // 通常の文字入力
                                        setSearchQuery(prev => prev + e.key);
                                    }
                                        break;
                                }
                            }
                            break;
                        }
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
                        <ul
                            className="flex flex-col">
                            {filteredListItems.map((item, index) => {
                                const isHeader = index < headerLines;
                                const delimiter = listConfig?.delimiter ?? ""
                                const targetField = listConfig?.withNth ?? 0
                                const fields = item.split(delimiter);
                                let displayText = item
                                if (delimiter != "" && targetField > 0) {
                                    displayText = fields[targetField] !== undefined ?
                                        fields[targetField] :
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
                                            outputLineByExit(filteredListItems, selectedIndex);
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
                    )}
                </div>
            </div>
        )
}
