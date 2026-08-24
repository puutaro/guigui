package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/puutaro/guigui/internal/apps/guigui/pkg/args"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/form"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/list"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/network"
	"github.com/puutaro/guigui/internal/apps/guigui/pkg/proc"
)

func (app *App) GetSendRequest() network.GuiRequest {
	return network.GuiRequest{}
}

func sendRegToGui(
	appConfig *args.AppConfig,
) {
	formConfig := form.FormConfigResponse{}
	if appConfig.FormCmd != nil {
		formConfig = appConfig.FormCmd.GetFormConfig()
	}
	listConfig := list.ListConfigResponse{}
	if appConfig.ListCmd != nil {
		listConfig = appConfig.ListCmd.GetListConfig()
	}
	sendReq := network.GuiRequest{
		ViewMode: appConfig.CmdName,
		Form:     formConfig,
		List:     listConfig,
	}
	sendReq.SendReqJson()
}
func serveGuiRes() {
	clientCh := make(chan string, 1)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go network.StartServer(
		ctx,
		network.GetResJsonFilePath(),
		clientCh,
	)
	for {
		select {
		case jsonPath := <-clientCh:
			if err := handleRes(jsonPath); err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(exitErrGeneral)
				return
			}
		case <-ctx.Done():
			log.Println("Main loop stopped.")
			return
		}
	}
}

func handleRes(
	jsonPath string,
) error {
	fileBytes, err := network.LoadFileAsBytes(jsonPath)
	if err != nil {
		return fmt.Errorf("failed to read JSON file: %w", err)
	}
	os.Remove(jsonPath)
	// 2. 構造体にパース（デコード）する
	var recievRes network.GuiResponse
	if err := json.Unmarshal(fileBytes, &recievRes); err != nil {
		return fmt.Errorf("failed to unmarshal JSON: %w", err)
	}
	switch {
	case recievRes.DownGui:
		proc.Kill(
			proc.GetPidByGuiProcessRunning(),
		)
	}
	if recievRes.Stdout != "" {
		fmt.Fprintln(os.Stdout, recievRes.Stdout)
	}
	// 🌟 2. 【最重要】バッファに残ったデータを強制的にパイプへ押し出す
	// これをしないと、直後のCloseでデータが消える可能性があります
	_ = os.Stdout.Sync()

	// 🌟 3. 出力ストリームを閉じる
	// これにより、grep側に「データはこれで全部だよ（EOF）」と伝わり、grep側が正常終了します
	// _ = os.Stdout.Close()
	// _ = os.Stderr.Close()
	// _ = os.Stdin.Close()
	os.Exit(recievRes.ExitCode)
	return nil
}
