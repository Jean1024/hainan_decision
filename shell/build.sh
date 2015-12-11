SHELLPATH=$(cd `dirname $0`; pwd)
PROJECT_PATH=$(cd $SHELLPATH; cd ..; pwd)
TARGET_PATH=$PROJECT_PATH/target
SOURCE_64=$TARGET_PATH/64
SOURCE_32=$TARGET_PATH/32
SOURCE_PATH=$TARGET_PATH/source
#1. get source
rm -rf $SOURCE_PATH
mkdir -p $SOURCE_PATH
$SHELLPATH/build_assets.sh

#2. change.js
node $SHELLPATH/change.js $SOURCE_PATH

cp -R $PROJECT_PATH/updater $SOURCE_PATH

#3. 64 or 32
rm -rf $SOURCE_64
rm -rf $SOURCE_32
mkdir -p $SOURCE_64
mkdir -p $SOURCE_32

cp -R $SOURCE_PATH/* $SOURCE_64/
cp -R $SOURCE_PATH/* $SOURCE_32/

cp $PROJECT_PATH/libs/*.exe $SOURCE_64/
cp $PROJECT_PATH/libs/*.exe $SOURCE_32/
cp -R $PROJECT_PATH/libs/node-webkit-v0.11.2-win-x64/* $SOURCE_64
cp -R $PROJECT_PATH/libs/node-webkit-v0.12.0-win-x32/* $SOURCE_32
