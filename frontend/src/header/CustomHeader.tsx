import {memo} from 'react';

export type CustomHeaderProps = {
    windowIcon: string,
    title: string,
}

export const CustomHeader = memo( ({
                                 windowIcon,
                                 title,
                             }: CustomHeaderProps) => {
    const isBase64 = windowIcon.startsWith('data:image/');
    const src = isBase64 ? windowIcon : `/${windowIcon}`;

    return (
        <div
            className="flex items-center justify-between text-white px-3 py-2 select-none"
            style={{
                backgroundColor: '#1b4d3e',
                // ★ Wails公式のドラッグ指定用CSS変数に変更
                '--wails-draggable': 'drag',
            } as React.CSSProperties}
        >
            {/* 左側：アイコンとタイトル */}
            <div className="flex items-center space-x-2">
                <img
                    src={src || "/appicon.png"}
                    alt="App Icon"
                    className="w-5 h-5 object-contain"
                />
                <span className="text-base font-bold text-white">{title}</span>
            </div>

            {/* 右側：最小化・閉じるボタンなど */}
            <div
                className="flex items-center space-x-2"
                style={{
                    // ★ ボタンの上ではドラッグを無効化する
                    '--wails-draggable': 'no-drag',
                } as React.CSSProperties}
            >
                <button
                    onClick={() => {
                        (async() => {
                            (window as any).runtime.Quit();
                        })()
                    }}
                    className="text-gray-300 hover:text-white px-2 text-lg font-bold"
                >
                    ×
                </button>
            </div>
        </div>
    );
});