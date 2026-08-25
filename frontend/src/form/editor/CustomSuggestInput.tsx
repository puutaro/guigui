import { SuggestHistoryItem } from "../FormComponent";
import { useEffect, useRef, useState } from "react";

export type CustomSuggestInputProps = {
    fieldKey: string;
    displayText: string;
    setFieldValue: (key: string, value: string) => void;
    historyItems: SuggestHistoryItem[];
    fontSize: number;
    borderValue: number;
}

export const CustomSuggestInput = (
    {
        fieldKey,
        displayText,
        setFieldValue,
        historyItems,
        fontSize,
        borderValue,
    }: CustomSuggestInputProps
) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [selectedSugIndex, setSelectedSugIndex] = useState<number>(-1);
    const [dropPosition, setDropPosition] = useState<'down' | 'up'>('down'); // ★ 表示方向の状態
    const containerRef = useRef<HTMLDivElement>(null);

    // 外側クリックでサジェストを閉じる
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('mousedown', handleOutsideClick);
        return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // 選択範囲の変更（全選択の検知）
    const handleSelect = (
        e: React.SyntheticEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        if (input.value.length > 0
            && input.selectionStart === 0
            && input.selectionEnd === input.value.length
        ) {
            setIsAllSelected(true);
            return
        }
        setIsAllSelected(false);
    };
    // 入力値でフィルタリング
    const filtered = historyItems.map((item) => {
       return item.value
    }).filter(sgText =>
        sgText.toLowerCase().includes((displayText || '').toLowerCase())
    );
    // サジェストを開く最終条件
    const shouldShowSuggest = isOpen && !isAllSelected && filtered.length > 0;
    // ★ 表示方向を判定する処理（画面の上下余白を計算）
    const updateDropPosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        // 下側の空きスペースが250px未満 かつ 上側のスペースの方が広い場合に「上出し」に設定
        if (spaceBelow < 250
            && spaceAbove > spaceBelow) {
            setDropPosition('up');
            return
        }
        setDropPosition('down');
    };
    // 開いた時または画面リサイズ時に位置を計算
    useEffect(() => {
        if (shouldShowSuggest) {
            updateDropPosition();
        }
    }, [shouldShowSuggest]);

    // 入力値変更や閉じた時に選択インデックスをリセット
    useEffect(() => {
        setSelectedSugIndex(-1);
    }, [displayText, isOpen]);

    return (
        <div ref={containerRef} className="relative w-full">
            <input
                type="text"
                value={displayText}
                onFocus={(e) => {
                    handleSelect(e);
                    updateDropPosition();
                    setIsOpen(true);
                }}
                onBlur={(e) => {
                    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                        setIsOpen(false);
                    }
                }}
                onSelect={handleSelect}
                onChange={(e) => {
                    setIsAllSelected(false);
                    setFieldValue(fieldKey, e.target.value);
                    updateDropPosition();
                    setIsOpen(true);
                }}
                onKeyDown={(e) => {
                    if (!shouldShowSuggest) return
                    switch(true){
                        case (e.key === 'ArrowDown'): {
                            e.preventDefault();
                            setSelectedSugIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
                            return;
                        }
                        case (e.key === 'ArrowUp'): {
                            e.preventDefault();
                            setSelectedSugIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
                            return;
                        }
                        case (e.key === 'Enter' && selectedSugIndex >= 0): {
                            e.preventDefault();
                            e.stopPropagation();
                            setFieldValue(fieldKey, filtered[selectedSugIndex]);
                            setIsOpen(false);
                            return;
                        }
                        case (e.key === 'Escape'): {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(false);
                            return;
                        }
                    }
                }}
                className="border rounded w-full"
                style={{
                    padding: `${borderValue}px`,
                    fontSize: `${fontSize}px`
                }}
            />

            {/* サジェストドロップダウン */}
            {shouldShowSuggest && (
                <ul
                    className={`absolute z-50 left-0 right-0 bg-white border rounded shadow-lg max-h-60 overflow-y-auto ${
                        dropPosition === 'up'
                            ? 'bottom-full mb-1'  // ★ 上側に表示
                            : 'top-full mt-1'     // ★ 下側に表示
                    }`}
                >
                    {filtered.map((sgText, index) => {
                        const isSelected = index === selectedSugIndex;
                        return (
                            <li
                                key={sgText} // ★ item.value だけでOK
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setFieldValue(fieldKey, sgText);
                                    setIsOpen(false);
                                }}
                                onMouseEnter={() => setSelectedSugIndex(index)}
                                className={`cursor-pointer ${
                                    isSelected ? 'bg-blue-100 text-blue-900 font-semibold' : 'hover:bg-blue-50'
                                }`}
                                style={{
                                    fontSize: `${fontSize}px`,
                                    padding: `${borderValue}px`
                                }}
                            >
                                {sgText}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};