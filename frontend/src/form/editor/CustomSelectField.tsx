// editor/CustomSelectField.tsx
import { useState, useRef, useEffect } from 'react';
import { form } from '../../../wailsjs/go/models';

export type CustomSelectFieldProps = {
    field: form.FieldDef;
    fieldKey: string;
    formValues: Record<string, string>;
    setFieldValue: (key: string, value: string) => void;
    borderValue: number;
};

export const CustomSelectField = ({
                                      field,
                                      fieldKey,
                                      formValues,
                                      setFieldValue,
                                      borderValue,
                                  }: CustomSelectFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

    const items = field.items ?? [];
    const currentValue = formValues[fieldKey] ?? field.defaultValue ?? "";

    // 外側をクリックしたら閉じる
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('mousedown', handleOutsideClick);
        return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // メニューが開いた時、または閉じた時のインデックス初期化
    useEffect(() => {
        if (!isOpen) {
            setSelectedIndex(-1);
            return;
        }
        // 開いた時は現在選択されている値の位置にカーソルを合わせる
        const currentIndex = items.indexOf(currentValue);
        setSelectedIndex(currentIndex >= 0 ? currentIndex : 0);
    }, [isOpen, currentValue, items]);

    // 矢印キー移動時の自動スクロール
    useEffect(() => {
        if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'auto',
            });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // 閉じていてEnter/Space/上下キーを押したら開く
        if (!isOpen) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault();
                setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
                break;
            }
            case 'Enter':
            case ' ': {
                e.preventDefault();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    setFieldValue(fieldKey, items[selectedIndex]);
                    setIsOpen(false);
                }
                break;
            }
            case 'Escape': {
                e.preventDefault();
                setIsOpen(false);
                break;
            }
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            {/* キー操作を受け取るための button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className="w-full border rounded text-left flex justify-between items-center bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                style={{ padding: `${borderValue}px` }}
            >
                <span>{currentValue}</span>
                <span className="ml-2">▼</span>
            </button>

            {/* ドロップダウンメニュー */}
            {isOpen && items.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto py-1">
                    {items.map((item, index) => {
                        const isFocused = index === selectedIndex;
                        const isSelected = item === currentValue;

                        return (
                            <li
                                key={item}
                                ref={(el) => (itemRefs.current[index] = el)}
                                onMouseDown={(e) => {
                                    // フォーカスが外れるのを防ぐ
                                    e.preventDefault();
                                }}
                                onClick={() => {
                                    // シングルクリック：選択ハイライトのみ移動（テキスト未確定）
                                    setSelectedIndex(index);
                                }}
                                onDoubleClick={() => {
                                    // ダブルクリック：値を確定してドロップダウンを閉じる
                                    setFieldValue(fieldKey, item);
                                    setIsOpen(false);
                                }}
                                className={`cursor-pointer whitespace-normal break-all leading-normal ${
                                    isFocused
                                        ? 'bg-blue-100 text-blue-900'
                                        : isSelected
                                            ? 'bg-blue-50 text-blue-800'
                                            : ''
                                }`}
                                style={{ padding: `${borderValue}px` }}
                            >
                                {item}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};