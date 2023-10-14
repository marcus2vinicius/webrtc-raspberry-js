# WebRTC Server with Javascript

### Install for use locally

Install chromium
```bash
$ sudo apt install chromium-browser -y
```

Install the necessary components to run graphic applications like Chromium without the need for a graphical interface. I'm assuming that you are running on a Linux server or a Raspberry Pi
```bash
$ sudo apt-get install screen
$ sudo apt-get install xvfb
```

Launch a server to deploy your app. You can use nginx, nodejs, python etc
```bash
$ npm install -g http-serve
$ http-serve -p 8081
```

Execute this command to open chromium with camera allowed
```bash
$ screen -S web xvfb-run chromium-browser --use-fake-ui-for-media-stream http://127.0.0.1:8081
```


### ~~by docker~~
```bash
$ docker-compose up
```
Loggin on docker container
```bash
$ docker ps
# get the name docker container something like 'server_server-app_1'
$ docker exec -u marcus -it server_server-app_1 bash
```

### 
Execute this command to open chromium with camera allowed
```bash
$ screen -S web xvfb-run chromium-browser --use-fake-ui-for-media-stream http://127.0.0.1:8081
```

WARNING: Docker way is not are completed way because I faced some issues using Chromium within a Docker container and being able to share my camera with it as well. I suggest installing it directly on your machine or on the Raspberry Pi.