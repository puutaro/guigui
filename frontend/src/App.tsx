import wailsLogo from './assets/wails.png'
import './App.css'
import { useEffect, useState, useRef } from 'react';
import { useEscClose, useLoadConfig, VIEW_MODES } from './useStartup';
import {
    GetFormConfig,
    GetListConfig,
} from '../wailsjs/go/main/App';
import { form, list } from '../wailsjs/go/models'
import { FormComponent } from './form/FormComponent';
import { ListComponent } from './list/ListComponent';
import { CustomHeader } from "./header/CustomHeader"; // タイポ修正

function App() {
    useEscClose()
    const { viewType, setViewType } = useLoadConfig();
    const [listConfig, setListConfig] = useState<list.ListConfigResponse | null>(null);
    // フォーム設定を保持するステート
    const [formConfig, setFormConfig] = useState<form.FormConfigResponse | null>(null);
    const [iconAndTitle, setIconAndTitle] =
        useState<{title: string, windowIcon: string}>({title: "", windowIcon: ""});

    // コンポーネントマウント時に Go から設定を取得
    useEffect(() => {
        switch (true){
            case (viewType === VIEW_MODES.FORM): {
                GetFormConfig()
                    .then((res) => {
                        setFormConfig(res);
                        if (res.windowIcon || res.title) setIconAndTitle(
                            {
                                title: res.title ?? "",
                                windowIcon: res.windowIcon ?? "",
                            }
                        );
                    })
                    .catch((err) => {
                        console.error("Failed to load form config:", err);
                    });
            }
                break;
            case (viewType === VIEW_MODES.LIST): {
                GetListConfig()
                    .then((res) =>{
                        setListConfig(res)
                        if (res.windowIcon || res.title) setIconAndTitle(
                            {
                                title: res.title ?? "",
                                windowIcon: res.windowIcon ?? "",
                            }
                        );
                    }).catch((err) =>{
                    console.error("Failed to load form config:", err);
                })
            }
                break;
        }
    }, [viewType]);

    let borderValue = 0;
    let fontSizeInt = 10;
    if (viewType === VIEW_MODES.FORM && formConfig) {
        borderValue = formConfig.borders ?? 0;
        fontSizeInt = formConfig.fontSize ?? 10;
    } else if (viewType === VIEW_MODES.LIST && listConfig) {
        borderValue = listConfig.borders ?? 0;
        fontSizeInt = listConfig.fontSize ?? 10;
    }
    const fontSizePx = `${fontSizeInt}px`;
    if (viewType === VIEW_MODES.LOADING) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        // 親要素をひとつにして、全体を縦方向のフレックスボックスにする

        <div
            // className="flex flex-col h-screen overflow-hidden bg-white font-mono"
            className="flex flex-col h-screen overflow-hidden bg-white font-mono shadow-2xl border border-gray-200 rounded-lg"
            style={{ fontSize: fontSizePx }}

        >
            {/* 1. 最上部にカスタムヘッダーを配置（ウィンドウドラッグ用） */}
            <CustomHeader
                windowIcon={iconAndTitle.windowIcon}
                title={iconAndTitle.title}
            />

            {/* 2. 残りのコンテンツエリア */}
            <div
                className="flex-1 h-0 overflow-hidden flex flex-col"
                style={{ padding: `${borderValue}px` }}
            >
                <div className="h-full w-full overflow-hidden flex flex-col">
                    {viewType === VIEW_MODES.FORM && (
                        <FormComponent
                            formConfig={formConfig}
                            borderValue={borderValue}
                        />
                    )}

                    {viewType === VIEW_MODES.LIST && (
                        <ListComponent
                            listConfig={listConfig}
                            borderValue={borderValue}
                        />
                    )}
                    {viewType === VIEW_MODES.ALERT && (
                        <div id="alert-view">
                            <h1 className="text-2xl font-bold text-blue-900 mb-4">Alert Dialog</h1>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App