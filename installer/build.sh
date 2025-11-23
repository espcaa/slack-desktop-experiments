GOOS=darwin GOARCH=arm64 go build -o ../install-webserver/assets/installer-bin-darwin-arm64 main.go
GOOS=darwin GOARCH=amd64 go build -o ../install-webserver/assets/installer-bin-darwin-amd64 main.go
GOOS=linux GOARCH=amd64 go build -o ../install-webserver/assets/installer-bin-linux-amd64 main.go
GOOS=linux GOARCH=arm64 go build -o ../install-webserver/assets/installer-bin-linux-arm64 main.go
