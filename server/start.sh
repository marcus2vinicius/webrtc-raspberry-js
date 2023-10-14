#!/bin/bash

http-serve -p 8081

# this is not work for me
# many tentative to use this and run 2 commands in background
#&& screen -S web xvfb-run chromium --no-sandbox --use-fake-ui-for-media-stream http://localhost:8081
