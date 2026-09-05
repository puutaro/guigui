
export const inputEscGuard = (
e: React.KeyboardEvent<HTMLInputElement>
) => {
    // ★ Esc キー押下時に Mac IME の誤入力とイベント伝播を遮断する
    if (e.key !== 'Escape') return
    e.preventDefault();
    e.stopPropagation();
    // IME 変換中でない場合はフォーカスを外して入力を確定・クリアする等
    if (e.nativeEvent.isComposing) return
    e.currentTarget.blur();
}