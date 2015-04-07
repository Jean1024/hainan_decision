#1. get source
/e/source/android/ChinaWeatherDecision_assets/shell/build_hainan_pc.sh

#2. copy pdf/*;package.json;login/*
PROJECT_PATH=/e/source/nodejs_project/HaiNanDecision_PC
TARGET_PATH=$PROJECT_PATH/target
echo $PROJECT_PATH
echo $TARGET_PATH

rm -rf $TARGET_PATH/setting.html
cp $PROJECT_PATH/setting.html $TARGET_PATH/

node /e/source/compresser/ $PROJECT_PATH/c/ $TARGET_PATH/c
node /e/source/compresser/ $PROJECT_PATH/pdf/ $TARGET_PATH/pdf
cp $PROJECT_PATH/package.json $TARGET_PATH/
