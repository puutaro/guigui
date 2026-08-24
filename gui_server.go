package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/network"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func (app *App) startGuiServer(
	ctx context.Context,
) {
	srvCh := make(chan string, 1)
	go network.StartServer(
		ctx,
		network.GetReqJsonFilePath(),
		srvCh,
	)
	for {
		select {
		case jsonPath := <-srvCh:
			// チャネルからパスが送られてくるたびに実行
			app.handleLoadAndSend(ctx, jsonPath)
		case <-ctx.Done():
			log.Println("Main loop stopped.")
			return
		}
	}
}

func (a *App) HandleSendRequest(req network.GuiRequest) {
	// ここで受け取ったリクエストを処理する
}

func (app *App) handleLoadAndSend(
	ctx context.Context,
	reqPath string,
) {
	// 連続イベント対策として、ファイルが完全に書き込まれるのを微小時間だけ待つか、そのまま処理
	loadErr := app.loadAndSendJson(
		ctx,
		reqPath,
	)
	if loadErr != nil {
		log.Printf("failed to load and send JSON: %v\n", loadErr)
	}
}

func (a *App) loadAndSendJson(
	ctx context.Context,
	filePath string,
) error {
	// 1. JSONファイルを開く
	fileBytes, err := network.LoadFileAsBytes(filePath)
	if err != nil {
		return fmt.Errorf("failed to read JSON file: %w", err)
	}
	os.Remove(filePath)
	// 2. 構造体にパース（デコード）する
	var sendReq network.GuiRequest
	if err := json.Unmarshal(fileBytes, &sendReq); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	windowPositionConfig := a.windowPositionConfig
	runtime.WindowUnminimise(a.ctx)
	runtime.WindowShow(a.ctx)
	switch {
	case windowPositionConfig.center:
		runtime.WindowCenter(ctx)
	case windowPositionConfig.x != nil && windowPositionConfig.y != nil:
		runtime.WindowSetPosition(
			ctx,
			*windowPositionConfig.x,
			*windowPositionConfig.y,
		)
	}
	windowSizeConfig := a.windowSizeConfig
	runtime.WindowSetSize(
		ctx,
		windowSizeConfig.width,
		windowSizeConfig.height,
	)
	// runtime.WindowUnminimise(ctx)
	// 3. Wailsのイベント機能を使ってGUIにプッシュ送信する
	// 第一引数: コンテキスト
	// 第二引数: フロントエンド側で待ち受けるイベント名（任意）
	// 第三引数: 送りたいデータ（Wailsが自動でJSのオブジェクトに変換してくれます）
	runtime.EventsEmit(a.ctx, "req", sendReq)

	return nil
}
