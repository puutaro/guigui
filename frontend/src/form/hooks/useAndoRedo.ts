import { useState, useCallback } from 'react';

export function useUndoRedo<T>(initialPresent: T) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);

  // 現在の状態全体を更新する関数
  const set = useCallback(
    (newPresent: T) => {
      if (newPresent === present) return;
      setPast((prevPast) => [...prevPast, present]);
      setPresent(newPresent);
      setFuture([]); 
    },
    [present]
  );

  // 【追加】オブジェクトの特定のキー（フィールド）だけを更新して履歴に残す便利関数
  const setFieldValue = useCallback(
    (key: string, value: string) => {
      // T が Record<string, any> であることを想定
      const currentObj = (present as Record<string, string>) || {};
      if (currentObj[key] === value) return;

      const newPresent = {
        ...currentObj,
        [key]: value,
      } as unknown as T;

      set(newPresent);
    },
    [present, set]
  );

  // Undo（Ctrl+Z）
  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
  }, [past, present]);

  // Redo（Ctrl+Y または Ctrl+Shift+Z）
  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [future, present]);

  return {
    state: present,
    set,
    setFieldValue, // <-- ここで新しく追加した関数を返す
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}