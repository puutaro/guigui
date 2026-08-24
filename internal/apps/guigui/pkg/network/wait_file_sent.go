package network

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/fsnotify/fsnotify"
)

func StartServer(
	ctx context.Context,
	jsonPath string,
	ch chan<- string, // 外部へ通知するためのチャネル（送信専用）
) {
	// 監視用のWatcherを作成
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		log.Printf("failed to create watcher: %v", err)
		return
	}
	defer watcher.Close()

	// 監視対象のディレクトリ（reqPathが存在するディレクトリ）を特定
	dir := filepath.Dir(jsonPath)
	// ディレクトリが存在しない場合は作成しておくなど初期化
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Printf("failed to create ipc dir: %v", err)
		return
	}
	// ディレクトリをウォッチャーに追加
	err = watcher.Add(dir)
	if err != nil {
		log.Printf("failed to watch directory: %v", err)
		return
	}
	// 起動時にすでにリクエストファイルが残っていた場合の対策
	if _, err := os.Stat(jsonPath); err == nil {
		os.Remove(jsonPath)
		// 起動時にすでにファイルがある場合も外部に通知するなら： ch <- jsonPath
	}

	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return
			}
			if !waitFileSent(jsonPath, event) {
				break
			}

			// 直接実行せず、チャネルにファイルパスを送信して外出しする
			select {
			case ch <- jsonPath:
			case <-ctx.Done():
				return
			}

		case err, ok := <-watcher.Errors:
			if !ok {
				return
			}
			log.Printf("watcher error: %v", err)
		case <-ctx.Done():
			log.Println("Context canceled, stopping server loop.")
			return
		}
	}
}
func waitFileSent(
	reqPath string,
	event fsnotify.Event,
) bool {
	if filepath.Clean(event.Name) != filepath.Clean(reqPath) {
		return false
	}
	if !event.Has(fsnotify.Create) {
		return false
	}
	info, err := os.Stat(reqPath)
	if err != nil {
		log.Printf("JSON not found in firstWait: %v\n", err)
		return false
	}
	waitMIlisec := 10 * time.Millisecond
	beforeSize := info.Size()
	for {
		time.Sleep(waitMIlisec)
		info, err := os.Stat(reqPath)
		if err != nil {
			log.Printf("JSON not found in second Wait: %v\n", err)
			break
		}
		curSize := info.Size()
		if curSize != beforeSize {
			beforeSize = curSize
			continue
		}
		break
	}
	return true
}
