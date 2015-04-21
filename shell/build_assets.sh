echo ----- hainan ------
index=1
ASSETS_PATH=/e/source/android/ChinaWeatherDecision_assets
TO_PATH=/e/source/nodejs_project/HaiNanDecision_PC/target/source
node /e/source/compresser/ $ASSETS_PATH/assets/ $TO_PATH/
echo $((index++)). compress files

cat $ASSETS_PATH/data/config_24.js > $TO_PATH/data/config.js
echo $((index++)). rewrite config.js

cat $TO_PATH/index_hainan.html > $TO_PATH/index.html
echo $((index++)). rewrite index.html

cat $TO_PATH/js/p_index_hainan.js > $TO_PATH/js/p_index.js
echo $((index++)). rewrite p_index.js

cat $TO_PATH/css/p_index_hainan.css > $TO_PATH/css/p_index.css
echo $((index++)). rewrite p_index.css

sed -i "s/p_index_hainan/p_index/" $TO_PATH/index.html
echo $((index++)). replace index.html css/js path

# cat $TO_PATH/typhoon_hainan.html > $TO_PATH/typhoon.html
# echo $((index++)). rewrite typhoon.html

cat $TO_PATH/setting_hainan.html > $TO_PATH/setting.html
echo $((index++)). rewrite setting.html

rm $TO_PATH/setting_*.html
echo $((index++)). rm setting_*.html

rm -rf $TO_PATH/img/bg_weather
echo $((index++)). rm img/bg_weather/*

rm $TO_PATH/js/p_index_*.js
echo $((index++)). rm js/p_index_*.js

rm $TO_PATH/css/p_index_*.css
echo $((index++)). rm css/p_index_*.css

# rm $TO_PATH/typhoon_*.html
# echo $((index++)). rm typhoon_*.html

rm $TO_PATH/index_*.html
echo $((index++)). rm index_*.html