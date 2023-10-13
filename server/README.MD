# WebRTC Server with Javascript

Install chromium
```bash
$ sudo apt install chromium-browser -y
```

Install the necessary components to run graphic applications like Chromium without the need for a graphical interface. I'm assuming that you are running on a Linux server or a Raspberry Pi
```bash
$ sudo apt-get install screen
$ sudo apt-get install xvfb
```
Execute this command to open chromium with camera allowed
```bash
$ screen -S web xvfb-run chromium-browser --use-fake-ui-for-media-stream http://127.0.0.1:8081
```