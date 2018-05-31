
set -e

source config.sh

export SCRIPT=$(cat <<END
docker build -t $DOCKERIMAGE . 2>&1
END
);

set +e
OUTPUT=$(eval $SCRIPT 2>&1);
STATUS="$?"
set -e

if [ "$STATUS" != "0" ]; then

    echo -e "for url: 'build process failed code:$STATUS\nstdout:>>>>$OUTPUT<<<\n\n"

    exit 1
fi

echo 'done...';




