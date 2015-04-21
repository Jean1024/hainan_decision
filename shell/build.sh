PROJECT_PATH=/e/source/nodejs_project/HaiNanDecision_PC
TARGET_PATH=$PROJECT_PATH/target

#1. get source
rm -rf $TARGET_PATH
mkdir $TARGET_PATH
/e/source/android/ChinaWeatherDecision_assets/shell/build_hainan_pc.sh

#2. copy pdf/*;package.json;login/*
rm -rf $TARGET_PATH/setting.html
cp $PROJECT_PATH/center/setting.html $TARGET_PATH/

node /e/source/compresser/ $PROJECT_PATH/center/ $TARGET_PATH/center
node /e/source/compresser/ $PROJECT_PATH/pdf/ $TARGET_PATH/pdf
cp $PROJECT_PATH/package.json $TARGET_PATH/

rm -rf $TARGET_PATH/center/setting.html


#3. change.js
node ./change.js $TARGET_PATH

cp -R $PROJECT_PATH/libs/node-webkit-v0.11.2-win-x64/* $TARGET_PATH