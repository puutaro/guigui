// editor/CustomSuggestInput.tsx

import { SuggestHistoryItem } from "../FormComponent";
import { useEffect, useMemo, useRef, useState } from "react";
import { filterListItemObjs } from "../../libs/filer";
import { renderForFilterText } from "../../libs/renderForFilterText";
import { is_special_str } from "../../libs/is_specaial_str";

export type CustomSuggestInputProps = {
    fieldKey: string;
    displayText: string;
    setFieldValue: (key: string, value: string) => void;
    historyItems: SuggestHistoryItem[];
    fontSize: number;
    borderValue: number;
};

export const CustomSuggestInput = ({
                                       fieldKey,
                                       displayText,
                                       setFieldValue,
                                       historyItems,
                                       fontSize,
                                       borderValue,
                                   }: CustomSuggestInputProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [selectedSugIndex, setSelectedSugIndex] = useState<number>(-1);
    const [dropPosition, setDropPosition] = useState<'down' | 'up'>('down');

    const isKeyboardNav = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

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
    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        if (
            input.value.length > 0 &&
            input.selectionStart === 0 &&
            input.selectionEnd === input.value.length
        ) {
            setIsAllSelected(true);
            return;
        }
        setIsAllSelected(false);
    };

    // 入力値でフィルタリング
    const filtered = useMemo(() => {
        return filterListItemObjs(
            historyItems.map((item) => item.value),
            displayText,
            "",
            -1
        );
    }, [historyItems, displayText]);

    const filteredObj = useMemo(() => {
        return renderForFilterText(filtered);
    }, [filtered]);

    // サジェストを開く最終条件
    const shouldShowSuggest = isOpen && !isAllSelected && filtered.length > 0;

    const sgMaxHeight = useMemo(()=>{
        const displayHeight = window.screen.height * 0.4
        const limitHeight = 400
        if(0 < displayHeight
            && displayHeight < limitHeight
        ) return displayHeight
        return limitHeight
    }, []);
    // 表示方向を判定する処理
    const updateDropPosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < sgMaxHeight && spaceAbove > spaceBelow) {
            setDropPosition('up');
            return;
        }
        setDropPosition('down');
    };

    useEffect(() => {
        if (!shouldShowSuggest) return
        updateDropPosition();
    }, [shouldShowSuggest]);

    // 非表示になったとき（または文字入力による検索時）に選択位置をリセット
    // ※ 矢印キー移動時などに reset されないよう依存配列を調整
    useEffect(() => {
        if (isOpen) return
        setSelectedSugIndex(-1);
    }, [isOpen]);

    // キーボード操作時のスクロール移動
    useEffect(() => {
        if (selectedSugIndex < 0
            || !itemRefs.current[selectedSugIndex]
        ) return
        isKeyboardNav.current = true;
        itemRefs.current[selectedSugIndex]?.scrollIntoView({
            block: 'nearest',   // 上下に収まっていない場合のみ最小限スクロール
            behavior: 'auto'
        });
        const timer = setTimeout(() => {
            isKeyboardNav.current = false;
        }, 100);
        return () => clearTimeout(timer);
    }, [selectedSugIndex]);

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
                    const newValue = e.target.value;
                    if (is_special_str(newValue)) {
                        return;
                    }
                    setIsAllSelected(false);
                    setFieldValue(fieldKey, newValue);
                    setSelectedSugIndex(-1); // 文字を入力した時だけ選択を解除
                    updateDropPosition();
                    setIsOpen(true);
                }}
                onKeyDown={(e) => {
                    if (!shouldShowSuggest) return;
                    switch (e.key) {
                        case 'ArrowDown': {
                            e.preventDefault();
                            setSelectedSugIndex((prev) =>
                                prev < 0 || prev >= filtered.length - 1 ? 0 : prev + 1
                            );
                            return;
                        }
                        case 'ArrowUp': {
                            e.preventDefault();
                            setSelectedSugIndex((prev) =>
                                prev <= 0 ? filtered.length - 1 : prev - 1
                            );
                            return;
                        }
                        case 'Enter': {
                            if (selectedSugIndex < 0) return;
                            e.preventDefault();
                            e.stopPropagation();
                            // Enterを押した時だけ input へ挿入して閉じる
                            setFieldValue(fieldKey, filtered[selectedSugIndex].lineKey);
                            setIsOpen(false);
                            return;
                        }
                        case 'Escape': {
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
                    fontSize: `${fontSize}px`,
                }}
            />

            {/* サジェストドロップダウン */}
            {shouldShowSuggest && (
                <ul
                    ref={listRef}
                    className={`absolute z-50 left-0 right-0 bg-white border rounded shadow-lg overflow-y-auto py-1 ${
                        dropPosition === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                    style={{
                        maxHeight: `${sgMaxHeight}px`,
                    }}
                >
                    {filteredObj.map((obj, index) => {
                        const isSelected = index === selectedSugIndex;
                        const sgText = obj.lineKey;
                        return (
                            <li
                                key={sgText}
                                ref={(el) => (itemRefs.current[index] = el)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onClick={() => {
                                    // シングルクリック：テキスト挿入は行わず、青色ハイライト（選択位置）のみ移動
                                    setSelectedSugIndex(index);
                                }}
                                onDoubleClick={() => {
                                    // ダブルクリック：Enterキーと同様に値を確定してドロップダウンを閉じる
                                    setFieldValue(fieldKey, sgText);
                                    setIsOpen(false);
                                }}
                                className={`cursor-pointer whitespace-normal break-all leading-normal ${
                                    isSelected ? 'bg-blue-100 text-blue-900 font-semibold' : ''
                                }`}
                                style={{
                                    fontSize: `${fontSize}px`,
                                    padding: `${borderValue}px`,
                                }}
                            >
                                {obj.renderedContent}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};