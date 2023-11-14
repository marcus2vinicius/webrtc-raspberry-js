#!/bin/bash

http-serve -p 8081

# this is not work for me
# many tentative to use this and run 2 commands in background
#&& screen -S web xvfb-run chromium --no-sandbox --use-fake-ui-for-media-stream http://localhost:8081
#screen -S web xvfb-run chromium-browser --use-fake-ui-for-media-stream --user-data-dir=/tmp/chromium-profile http://localhost:8081
#screen -S web xvfb-run chromium-browser --use-fake-ui-for-media-stream --user-data-dir=/tmp/chromium-profile --disable-background-networking --disable-background-tasks --disable-client-side-phishing-detection --disable-default-apps --disable-extensions --disable-features=site-per-process --disable-hang-monitor --disable-prompt-on-repost --disable-sync --disable-web-resources --enable-automation --password-store=basic --use-mock-keychain --no-first-run --no-sandbox --disable-infobars --disable-session-crashed-bubble --flag-switches-begin --flag-switches-end http://localhost:8081 2> chromium_error.log
#screen -S web xvfb-run chromium-browser --use-fake-ui-for-media-stream --user-data-dir=/tmp/chromium-profile --disable-background-networking --disable-background-tasks --disable-client-side-phishing-detection --disable-default-apps --disable-extensions --disable-features=site-per-process --disable-hang-monitor --disable-prompt-on-repost --disable-sync --disable-web-resources --enable-automation --password-store=basic --use-mock-keychain --no-first-run --no-sandbox --disable-infobars --disable-session-crashed-bubble --flag-switches-begin --flag-switches-end http://localhost:8081 2> chromium_error.log
