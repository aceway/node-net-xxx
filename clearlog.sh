#!/usr/bin/env bash
########################################################################
#    File Name: clearlog.sh
# 
#       Author: Taomee Shanghai,Inc.
#         Mail: aceway@taomee.com
# Created Time: Tue 10 May 2016 03:48:26 PM CST
#  Description: ...
# 
########################################################################
term_info=${TERM:-"dumb"}

if [ -z ${term_info} ] || [ "${term_info}" = "dumb" ];then
    RED=""
    GREEN=""
    BLUE=""
    YELLOW=""
    GRAY=""
    LIGHT_RED=""
    LIGHT_YELLOW=""
    LIGHT_GREEN=""
    LIGHT_BLUE=""
    LIGHT_GRAY=""
    END=""
else
    RED="\033[0;31m"
    GREEN="\033[0;32m"
    BLUE="\033[0;34m"
    YELLOW="\033[0;33m"
    GRAY="\033[0;37m"
    LIGHT_RED="\033[1;31m"
    LIGHT_YELLOW="\033[1;33m"
    LIGHT_GREEN="\033[1;32m"
    LIGHT_BLUE="\033[0;34m"
    LIGHT_GRAY="\033[1;37m"
    END="\033[0;00m"
fi

dt=`date +"%Y %m %d %H %M %S"`
array=($dt)
year=${array[0]}
month=${array[1]}
day=${array[2]}
hour=${array[3]}
minute=${array[4]}
second=${array[5]}

cd `dirname $0`

if [ -d ./logs ];then
    rm -rf  ./logs/* 2 >/dev/null
fi
