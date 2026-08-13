export {};


declare global {
  interface Window {
    // Wailsの自動生成オブジェクトの型構造に合わせて定義します
    go: {
      [key: string]: any; // または正確なパッケージ名・構造体の型
    };
  }
}