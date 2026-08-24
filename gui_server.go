package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/fstanis/screenresolution"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
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

func (a *App) HandleSendRequest(req network.GuiRequestForWebview) {
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
	var sendSrcReq network.GuiRequest
	if err := json.Unmarshal(fileBytes, &sendSrcReq); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	runtime.WindowUnminimise(a.ctx)
	geometry := sendSrcReq.Geometry
	winWidth := geometry.Width
	winHeight := geometry.Height
	switch {
	case geometry.IsCenter:
		res := screenresolution.GetPrimary()
		if res == nil {
			runtime.WindowCenter(ctx)
		} else {
			x := (res.Width - winWidth) / 2
			y := (res.Height - winHeight) / 2
			runtime.WindowSetPosition(a.ctx, x, y)
		}
	case geometry.X != nil && geometry.Y != nil:
		runtime.WindowSetPosition(
			ctx,
			*geometry.X,
			*geometry.Y,
		)
	}
	runtime.WindowSetSize(
		ctx,
		winWidth,
		winHeight,
	)
	// 3. Wailsのイベント機能を使ってGUIにプッシュ送信する
	// 第一引数: コンテキスト
	// 第二引数: フロントエンド側で待ち受けるイベント名（任意）
	// 第三引数: 送りたいデータ（Wailsが自動でJSのオブジェクトに変換してくれます）
	runtime.EventsEmit(a.ctx, "req", network.GuiRequestForWebview{
		ViewMode: sendSrcReq.ViewMode,
		Form:     sendSrcReq.Form,
		List:     sendSrcReq.List,
	})

	return nil
}
func minimizeGUi(ctx context.Context) {
	runtime.EventsEmit(ctx, "req", network.GuiRequestForWebview{
		ViewMode: "list",
		List: list.ListConfigResponse{
			Title: "Guigui sleeping...",
			Text:  "Sleeping...",
		},
	})
	// time.Sleep(50 * time.Millisecond)
	runtime.WindowMinimise(ctx)
}
