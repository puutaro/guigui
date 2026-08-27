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
    const containerRef = useRef<HTMLDivElement>(null);

    // 現在の値（設定されていない場合は初期値）
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

    return (
        <div ref={containerRef} className="relative w-full">
            {/* セレクトボックスの代わりにクリックで開閉するボタン */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full border rounded text-left flex justify-between items-center bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
                style={{ padding: `${borderValue}px` }}
            >
                <span>{currentValue}</span>
                <span className="text-xs ml-2">▼</span>
            </button>

            {/* ドロップダウンメニュー */}
            {isOpen && (
                <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto py-1">
                    {field.items?.map((item) => {
                        const isSelected = item === currentValue;
                        return (
                            <li
                                key={item}
                                onClick={() => {
                                    setFieldValue(fieldKey, item);
                                    setIsOpen(false);
                                }}
                                className={`cursor-pointer px-3 py-1 hover:bg-blue-100 ${
                                    isSelected ? 'bg-blue-50 font-semibold text-blue-900' : ''
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