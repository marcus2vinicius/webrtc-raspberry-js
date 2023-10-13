#!/bin/bash

http-serve -p 8081 &

screen -S web xvfb-run chromium-browser --use-fake-ui-for-media-stream http://127.0.0.1:8081
