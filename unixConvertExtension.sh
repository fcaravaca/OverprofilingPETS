#!/bin/bash

echo 'Removing prior build...'
rm -rf ./dist
rm ./latestBuild.zip
echo 'Prior build removed!'
echo 'Preparing new extension build..'

npm run build

mv ./build ./dist  #/s /e
echo 'Renaming files...'
mv dist/index.html ./dist/popup.html
