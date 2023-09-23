#!/bin/sh

OUTPUT_FILE=$1
read -r line
echo $line > $OUTPUT_FILE
# Echo empty object to make the managing JS code continue.
echo {}
