#!/bin/bash

#set -o xtrace
#set -e

FLAG=$1
THISFILE="$(basename $0)"

if [ "$#" == 0 ] ; then

  echo "give flag parameter"

  exit 1

else

  LIST=$(ps aux | grep $FLAG | grep -v grep | grep -v "$THISFILE" | grep -v 'apache-deploy')

  PIDS=$(echo -e "$LIST" | awk '{print $2}');

  echo -e "\nlisting processes to kill:\n";
  echo -e $"$LIST\n"

  echo -e "\nlisting pids to kill:\n";
  echo -e $"$PIDS\n";

  for pid in $PIDS
  do
      echo "attempt to kill $pid"
      kill -s 9 $pid && echo 'success' || echo 'failure'
  done

  echo -e "\n"

  exit 0;
fi

