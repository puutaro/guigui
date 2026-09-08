## wevdi

This is daialog cli tool like gnu yad by linux, mac suport

An ultra-fast, Webview-based dialog command built for Linux and macOS, bridging the gap between modern GUI experiences and powerful CLI workflows.
webdi is an unconventional, high-performance CLI tool built with Wails that brings powerful, customizable dialogs—reminiscent of yad or fzf—to your terminal environment.


## 🚀 Experience the Difference

While it shares familiar concepts with tools like yad and fzf, webdi delivers a uniquely fluid dialog experience. Try it out in your next shell script or terminal workflow and feel the speed!


## ✨ Key Features

### Blazing-Fast Performance: The first launch initializes the webview smoothly, while the second invocation and onward run at blinding speeds by leveraging smart IPC and OS-level process management.  

### Yad-like Forms & Fzf-like Lists: Seamlessly create rich form dialogs and interactive list selectors driven directly by shell scripts or standard input (stdin).  

 ### Cross-Platform Support: Fully compatible and optimized for both Linux and macOS.  

### Persistent Resident Mode (--keep): By using the --keep flag, the dialog stays active in the background, allowing you to use it as a persistent floating web page or an ultra-fast web UI prototyping tool.  

### Unrivaled CLI Integration: An exceptional Wails application engineered specifically for terminal power users.  

## Demo

<img width="1571" height="1018" alt="webdi_demo" src="https://github.com/user-attachments/assets/a40a3243-9e6d-4b60-b69b-261b72848aee" />


## Install

```
curl https://raw.githubusercontent.com/puutaro/webdi/refs/heads/master/install.sh \
| bash
```

## ⚙️ Subcommands & Usage

webdi provides dedicated subcommands for forms, lists, and window manipulation:  

###  form Subcommand  

Launches an interactive form dialog with customizable fields, buttons, and layouts.  

```sh
webdi form --title "User Form" --field "Name:TXT" --field "Role:CB" "Developer!Designer"
```

#### --field: 

Define form fields (supports types like TXT, CB, CBE, NUM, LBL). Use `base64://` prefix for multi-line inputs.


#### --button: 

Define custom buttons and their exit codes 

```
(e.g., --button "Save:0" --button "Cancel:1").
```

#### --item-separator: 

Separator for list items in choice fields (default: !).  


#### --separator: Separator for output values (default: |).

#### --no-buttons: 

Hide default buttons.


### list 

Launches an interactive list selector (similar to fzf) accepting data via arguments or standard input (stdin).
ls -la | webdi list --title "Select File" --header-lines 1

#### --delimiter: 

Delimiter for splitting columns in list lines.

#### --with-nth: 

Display specific fields based on the delimiter.

#### --header-lines: 

Number of header lines to display.

#### --cycle: 

Enable cursor cycling at the ends of the list.


#### --reload, --execute, --exec-quit: 

Bind custom shell commands to specific keys (e.g., alt+r:echo reload).


## Common Window Options (Available for Form & List)

### --title: 

Window title string.

### --text: 

Description message (supports base64:// for multi-line text).

### --width / --height: 

Window dimensions (defaults: 1024x768).

### --center: 

Center the window position.

### --x / --y: 

Specific window coordinates.


### --borders: 

Component padding (default: 10).


### --font-size: 

Font size (default: 10).


### --window-icon: 

Path to window icon.


### --keep: 

Keep the window displayed even after pressing Enter or Escape.


### --keep-excludes: 

Exclusions for keep behavior (e.g., esc,ok,cancel).


### --id / --sub-id: 

Unique identifiers for GUI server management and component scoping.


