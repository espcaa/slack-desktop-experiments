package main

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"runtime"

	"github.com/charmbracelet/lipgloss"
)

const web_server_url = "http://localhost:8080"

// slack modded installer
// only macos export for now :(

//---
// style definitions
//---

var mainTitleStyle = lipgloss.NewStyle().
	Bold(true).
	Border(lipgloss.NormalBorder()).
	Padding(1, 2).Margin(1, 0).
	Foreground(lipgloss.Color("5")).
	Align(lipgloss.Center)

var subtitleStyle = lipgloss.NewStyle().
	Italic(true).
	Foreground(lipgloss.Color("8")).
	Align(lipgloss.Center)

var textStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("7")).
	Align(lipgloss.Left)

var successStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("10")).
	Bold(true)

var errorStyle = lipgloss.NewStyle().
	Foreground(lipgloss.Color("9")).
	Bold(true)

//---

func main() {
	fmt.Println(mainTitleStyle.Render("slack plugin thingy installer "))

	// check what os we are os

	fmt.Println(subtitleStyle.Render("detecting operating system..."))

	os := runtime.GOOS
	switch os {
	case "darwin":
		fmt.Println(successStyle.Render("your os is supported!"))
		MacOSInstall()
	default:
		fmt.Println(errorStyle.Render("unsupported operating system: " + os))
	}
}

func MacOSInstall() {
	// checking if slack is already installed

	fmt.Println(textStyle.Render("checking if slack is installed..."))
	installed, installed_path := IsSlackInstalledMacOS()
	if installed {
		fmt.Println(successStyle.Render("slack is installed!"))
	} else {
		fmt.Println(errorStyle.Render("slack is not installed. please install it!!"))
		return
	}

	fmt.Println(textStyle.Render("slack installation path: " + installed_path))

	// create the temp dir

	removeCmd := "rm -rf /tmp/slackplugin/"
	fmt.Println(subtitleStyle.Render("running : " + removeCmd))
	err := exec.Command("bash", "-c", removeCmd).Run()
	if err != nil {
		fmt.Println(errorStyle.Render("failed to clear temporary directory: " + err.Error()))
		return
	}

	fmt.Println(textStyle.Render("creating temporary directory..."))
	tempDir := "/tmp/slackplugin"
	err = os.MkdirAll(tempDir, 0755)
	if err != nil {
		fmt.Println(errorStyle.Render("failed to create temporary directory: " + err.Error()))
		return
	}
	fmt.Println(successStyle.Render("temporary directory created at " + tempDir))
	// clearing out the temp dir

	// copy the app to the temp dir
	fmt.Println(textStyle.Render("copying slack to temporary directory..."))

	copyCmd := fmt.Sprintf("cp -R \"%s\" \"%s/\"", installed_path, tempDir)
	fmt.Println(subtitleStyle.Render("running : " + copyCmd))
	err = exec.Command("bash", "-c", copyCmd).Run()
	if err != nil {
		fmt.Println(errorStyle.Render("failed to copy slack to temporary directory: " + err.Error()))
		return
	}
	fmt.Println(successStyle.Render("slack copied to temporary directory :D"))

	// check if bun/npm is installed

	fmt.Println(textStyle.Render("checking if a javascript runtime is installed..."))
	javascriptRuntime := ""
	_, err = exec.LookPath("bun")
	if err != nil {
		_, err = exec.LookPath("npm")
		if err != nil {
			fmt.Println(errorStyle.Render("no javascript runtime found. please install bun or npm!"))
			return
		} else {
			javascriptRuntime = "npx"
			fmt.Println(successStyle.Render("npm found!"))
		}
	} else {
		fmt.Println(successStyle.Render("bun found!"))
		javascriptRuntime = "bunx"
	}

	// unpack the asar file
	asar_filename := "app.asar"

	fmt.Println(textStyle.Render("unpacking asar file..."))
	command := javascriptRuntime + " asar extract \"" + tempDir + "/Slack.app/Contents/Resources/" + asar_filename + "\" \"" + tempDir + "/asar_unpacked\""
	fmt.Println(subtitleStyle.Render("running : " + command))
	err = exec.Command("bash", "-c", command).Run()
	if err != nil {
		fmt.Println(errorStyle.Render("failed to unpack asar file: " + err.Error()))
		return
	}
	fmt.Println(successStyle.Render("asar file unpacked!"))

	// download the loader script

	resp, err := http.Get(web_server_url + "/inject.js")
	if err != nil {
		fmt.Println(errorStyle.Render("failed to download loader script: " + err.Error()))
		return
	}
	defer resp.Body.Close()

	loaderScriptPath := tempDir + "/inject.js"
	outFile, err := os.Create(loaderScriptPath)

	if err != nil {
		fmt.Println(errorStyle.Render("failed to create loader script file: " + err.Error()))
		return
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, resp.Body); err != nil {
		fmt.Println("failed to save loader script: " + err.Error())
		return
	}

	injectedCodeBytes, err := os.ReadFile(loaderScriptPath)
	if err != nil {
		fmt.Println("failed to read downloaded script: " + err.Error())
		return
	}

	targetFilePath := tempDir + "/asar_unpacked/index.js"

	targetFileContent, err := os.ReadFile(targetFilePath)
	if err != nil {
		fmt.Println("failed to read target file: " + err.Error())
		return
	}

	// remove require(process._archPath); from the original file

	re := regexp.MustCompile(`\s*require\(process\._archPath\);\s*`)
	targetFileContent = re.ReplaceAll(targetFileContent, []byte(""))

	// inject the inject.js code at the end of the file

	modifiedContent := append(targetFileContent, []byte("\n// injected code below\n")...)
	modifiedContent = append(modifiedContent, injectedCodeBytes...)

	// write back the modified content

	err = os.WriteFile(targetFilePath, modifiedContent, 0644)
	if err != nil {
		fmt.Println("failed to write modified content back to target file: " + err.Error())
		return
	}

	fmt.Println(successStyle.Render("loader script injected into preload.bundle.js!"))

	// repack the asar file

	fmt.Println(textStyle.Render("repacking asar file..."))
	command = javascriptRuntime + " asar pack \"" + tempDir + "/asar_unpacked\" \"" + tempDir + "/Slack.app/Contents/Resources/" + asar_filename + "\""
	fmt.Println(subtitleStyle.Render("running : " + command))
	err = exec.Command("bash", "-c", command).Run()
	if err != nil {
		fmt.Println(errorStyle.Render("failed to repack asar file: " + err.Error()))
		return
	}
	fmt.Println(successStyle.Render("asar file repacked!"))

	// codesign the app to avoid macos blocking it later
	fmt.Println(textStyle.Render("codesigning the modified app..."))
	codesignCmd := exec.Command("codesign", "--force", "--deep", "--sign", "-", tempDir+"/Slack.app/Contents/MacOS/Slack")
	err = codesignCmd.Run()
	if err != nil {
		fmt.Println(errorStyle.Render("failed to codesign the app: " + err.Error()))
		return
	}
	fmt.Println(successStyle.Render("app codesigned!"))

	var oldHash string
	var newHash string

	// change the hashes of the asar files to avoid integrity checks
	// get the old/new ones by running the slack binary and checking the <2 stderr output
	for {
		fmt.Println(textStyle.Render("bypassing asar integrity checks..."))

		cmd := exec.Command(tempDir + "/Slack.app/Contents/MacOS/Slack")

		// capture stderr
		stderr, err := cmd.StderrPipe()
		if err != nil {
			fmt.Println(errorStyle.Render("failed to get stderr pipe: " + err.Error()))
			return
		}

		if err := cmd.Start(); err != nil {
			fmt.Println(errorStyle.Render("Slack failed to start: " + err.Error()))
			return
		}

		re := regexp.MustCompile(`Integrity check failed for asar archive \(([0-9a-f]{64})\ vs\ ([0-9a-f]{64})\)`)

		scanner := bufio.NewScanner(stderr)
		found := false

		for scanner.Scan() {
			line := scanner.Text()

			if match := re.FindStringSubmatch(line); match != nil {
				oldHash = match[1]
				newHash = match[2]
				fmt.Println(successStyle.Render("captured hashes!"))
				fmt.Println(textStyle.Render("old hash: " + oldHash))
				fmt.Println(textStyle.Render("new hash: " + newHash))
				found = true
				break
			}
		}

		// close process
		cmd.Process.Kill()
		cmd.Wait()

		// CASE 1 — hashes captured → break loop
		if found {
			break
		}

		// CASE 2 — no hashes, Slack was probably blocked by Gatekeeper
		fmt.Println(errorStyle.Render("Slack was blocked by macOS Gatekeeper."))
		fmt.Println(textStyle.Render(`
Please do the following:

1. Open System Settings
2. Go to Privacy & Security
3. Scroll to the bottom
4. Click "Open Anyway" for Slack
5. Then come back and press ENTER to retry.
`))

		// wait for user
		bufio.NewReader(os.Stdin).ReadBytes('\n')

		fmt.Println(textStyle.Render("retrying…"))
	}

	// download the utils replacing script

	utilsScriptResp, err := http.Get(web_server_url + "/utils-replace-macos.sh")
	if err != nil {
		fmt.Println(errorStyle.Render("failed to download utils replace script: " + err.Error()))
		return
	}
	defer utilsScriptResp.Body.Close()

	utilsScriptPath := tempDir + "/utils-replace-macos.sh"
	utilsOutFile, err := os.Create(utilsScriptPath)

	if err != nil {
		fmt.Println(errorStyle.Render("failed to create utils replace script file: " + err.Error()))
		return
	}
	defer utilsOutFile.Close()

	if _, err := io.Copy(utilsOutFile, utilsScriptResp.Body); err != nil {
		fmt.Println("failed to save utils replace script: " + err.Error())
		return
	}

	// make the script executable
	err = os.Chmod(utilsScriptPath, 0755)
	if err != nil {
		fmt.Println(errorStyle.Render("failed to make utils replace script executable: " + err.Error()))
		return
	}

	// run the script to replace the hashes
	// cd in the temp dir + pass oldHash + newHash as args
	fmt.Println(textStyle.Render("running utils to replace hashes..."))
	replaceCmd := "cd " + tempDir + " && ./utils-replace-macos.sh " + oldHash + " " + newHash
	fmt.Println(subtitleStyle.Render("running : " + replaceCmd))
	err = exec.Command("bash", "-c", replaceCmd).Run()
	fmt.Println(successStyle.Render("bypassed asar integrity checks!"))

	// copy the app to /Downloads

	fmt.Println(textStyle.Render("copying it back..."))
	copyBackCmd := fmt.Sprintf("cp -R \"%s/Slack.app\" \"%s/Downloads/Slack.app\"", tempDir, os.Getenv("HOME"))

	fmt.Println(subtitleStyle.Render("running : " + copyBackCmd))
	err = exec.Command("bash", "-c", copyBackCmd).Run()
	if err != nil {
		fmt.Println(errorStyle.Render("failed to copy modified slack back to /Applications: " + err.Error()))
		return
	}
	fmt.Println(successStyle.Render("modified slack copied to /Downloads!"))

	// installing the required preload.js and plugin-manager.js files in ~/.slack-plugin-thingy/
	//
	// create the dir if it doesn't exist

	pluginDir := fmt.Sprintf("%s/.slack-plugin-thingy", os.Getenv("HOME"))
	err = os.MkdirAll(pluginDir, 0755)
	if err != nil {
		fmt.Println(errorStyle.Render("failed to create plugin directory: " + err.Error()))
		return
	}

	// download preload.js

	preloadResp, err := http.Get(web_server_url + "/preload.js")
	if err != nil {
		fmt.Println(errorStyle.Render("failed to download preload.js: " + err.Error()))
		return
	}
	defer preloadResp.Body.Close()

	preloadPath := pluginDir + "/preload.js"
	preloadOutFile, err := os.Create(preloadPath)

	if err != nil {
		fmt.Println(errorStyle.Render("failed to create preload.js file: " + err.Error()))
		return
	}
	defer preloadOutFile.Close()

	if _, err := io.Copy(preloadOutFile, preloadResp.Body); err != nil {
		fmt.Println("failed to save preload.js: " + err.Error())
		return
	}

	// download plugin-manager.js

	managerResp, err := http.Get(web_server_url + "/plugin-manager.js")
	if err != nil {
		fmt.Println(errorStyle.Render("failed to download plugin-manager.js: " + err.Error()))
		return
	}
	defer managerResp.Body.Close()

	managerPath := pluginDir + "/plugin-manager.js"
	managerOutFile, err := os.Create(managerPath)

	if err != nil {
		fmt.Println(errorStyle.Render("failed to create plugin-manager.js file: " + err.Error()))
		return
	}
	defer managerOutFile.Close()

	if _, err := io.Copy(managerOutFile, managerResp.Body); err != nil {
		fmt.Println("failed to save plugin-manager.js: " + err.Error())
		return
	}

	fmt.Println(successStyle.Render("preload.js and plugin-manager.js installed!"))

	fmt.Println(successStyle.Render("installation completed! please open the modified Slack app from /Downloads and enjoy :)"))

}

func IsSlackInstalledMacOS() (bool, string) {
	// check if /Applications/Slack.app exists or ~/Applications/Slack.app exists

	paths := []string{
		"/Applications/Slack.app",
		fmt.Sprintf("%s/Applications/Slack.app", os.Getenv("HOME")),
	}

	for _, path := range paths {
		if _, err := os.Stat(path); err == nil {
			return true, path
		}
	}

	return false, ""
}
