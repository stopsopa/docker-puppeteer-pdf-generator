#!/bin/bash

#set -o xtrace
#set -e

FLAG=$1
THISFILE="$(basename $0)"

if [ "$#" == 0 ] ; then

      echo "give flag parameter"

      exit 1

else

    COUNT=$(ps aux | grep $FLAG | grep -v grep | grep -v "$THISFILE" | grep -v 'apache-deploy' | wc -l)

    if [ "$COUNT" != "1" ]; then

        exit 1
    fi
fi

