import {SuggestHistoryItem} from "../FormComponent";
import {useEffect, useRef, useState} from "react";

export type CustomSuggestInputProps = {
    fieldKey: string;
    displayText: string;
    setFieldValue: (key: string, value: string) => void;
    historyItems:  SuggestHistoryItem[];
    borderValue: number;
}

export const CustomSuggestInput = ({
       fieldKey,
       displayText,
       setFieldValue,
       historyItems,
       borderValue,
   }: CustomSuggestInputProps
) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 外側クリック時や Esc キーでサジェストを閉じる
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('mousedown', handleOutsideClick);
        return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // 入力値でフィルタリング（前方一致または部分一致）
    const filtered = historyItems.filter(item =>
        item.value.toLowerCase().includes((displayText || '').toLowerCase())
    );

    return (
        <div ref={containerRef} className="relative w-full">
            <input
                type="text"
                value={displayText}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                    setFieldValue(fieldKey, e.target.value)
                    setIsOpen(true);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                        e.stopPropagation(); // フォーム側のEscイベント伝播を防止
                    }
                }}
                className="border rounded w-full"
                style={{ padding: `${borderValue}px` }}
            />

            {/* サジェストドロップダウン */}
            {isOpen && filtered.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                    {filtered.map((item) => (
                        <li
                            key={`${item.value}-${item.timestamp}`}
                            onClick={() => {
                                setFieldValue(fieldKey, item.value);
                                setIsOpen(false);
                            }}
                            className="px-3 py-1.5 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                            {item.value}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};