
// MacのOptionキー等で入力される禁止文字リスト
const SPECIAL_CHARS = new Set([
    '≈', 'ç', '√', '∫', '˜', 'µ', '≤', '≥', 'å',
    'ß', '∂', 'ƒ', '©', '˙', '∆', '˚', '¬', 'æ', '«',
    'œ', '∑', '®', '†', 'ø', 'π'
]);

export const is_special_str = (str: string): boolean => {
    // 文字列内の文字を1文字ずつチェック
    for (let i = 0; i < str.length; i++) {
        if (!SPECIAL_CHARS.has(str[i])) continue
        return true;
    }
    return false;
};