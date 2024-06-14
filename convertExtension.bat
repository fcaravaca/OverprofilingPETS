@ECHO OFF
echo 'Removing prior build...' 
rd /s /q .\dist
del .\latestBuild.zip
echo 'Prior build removed!' 
echo 'Preparing new extension build..' 

call npm run build

mkdir dist
robocopy .\build .\dist  /s /e
echo 'Renaming files...' 
move .\dist\index.html .\dist\popup.html


