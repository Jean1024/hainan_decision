#!/bin/bash

echo ----- hainan ------
index=1
ASSETS_PATH=/f/source/node_projects/HaiNanDecision_PC/assets
TO_PATH=/f/source/node_projects/HaiNanDecision_PC/target/source

rm -rf $TO_PATH
mkdir -p $TO_PATH
node /f/source/node_projects/compresser/  $ASSETS_PATH/ $TO_PATH/
echo $((index++)). compress files
