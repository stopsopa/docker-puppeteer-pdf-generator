# Version:
    
In this repository there are two versions available. One with Google Chrome another with Chromium.
For more information see [releases](https://github.com/stopsopa/docker-puppeteer-pdf-generator/releases)


# Installation:

    mkdir node-pdf
    cd node-pdf
    git clone git@github.com:stopsopa/docker-puppeteer-pdf-generator.git .
    yarn
    docker build -t puppeteer-alpine-generate-pdf .
    cp config.js.dist config.js
    
    # manually change password in config.js for basic auth
    
    node server.js --port 7777
    

# Using:
    
Just visit:

        http://localhost:7777/generate


# cli tool:

    /bin/bash pdf.sh "https://www.google.com/search?ncr=&q=puppeteer"

    /bin/bash pdf.sh "https://www.google.com/search?ncr=&q=puppeteer" pdf.pdf
    
    
# Current execution environment:

    - node v8.9.4
    - yarn
    - Docker version 18.03.1-ce, build 9ee9f40
    
# Puppeteer in Docker:
    
[Running puppeteer in Docker](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker)       
    
# Ping:
    
    http://xx.xx.xx.xx:7777/pdf-generator-check 
    http://slowwly.robertomurray.co.uk/delay/32000/url/https://github.com/stopsopa/docker-puppeteer-pdf-generator
    
# Useful things:  
        
    docker run -it --rm puppeteer-alpine-generate-pdf /usr/bin/chromium-browser --version        
        $ Chromium 64.0.3282.168
        
    or if you follow node:8-slim : https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#running-puppeteer-in-docker
        docker run -it --rm --cap-add=SYS_ADMIN --rm puppeteer-chrome-linux /usr/bin/google-chrome-unstable --version
            Google Chrome 68.0.3438.3 dev
        
    on mac:
        /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version
            $ Google Chrome 66.0.3359.181
        /Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --version
            $ Google Chrome 69.0.3445.0 canary
    
        
# Dev notes:
    
I've build this "on top" of docker not "in" docker which mean that I have instance of node server an this server creates on demand container with puppeteer to generate one pdf and kill this container because there is chance that this approach will make entire solution more stable.
And this server was ment to build as fast as possible to do its job. Main priority was to build it fast and make it work and it's seems to work so far.
           
    
