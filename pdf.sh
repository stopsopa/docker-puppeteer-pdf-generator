
set -e

URL=$1

TMPFILE="pdf.pdf"

DOCKERIMAGE="puppeteer-alpine-generate-pdf"

if [ $# -lt 1 ] ; then

cat << EOF

Provide at least one argument (url), like:

    /bin/bash $0 \"http://google.com\"

You can also specify output file name:

    /bin/bash $0 \"http://google.com\" pdf.pdf

    default is "$TMPFILE"

Full examples:

    /bin/bash pdf.sh "https://www.google.com/search?ncr=&q=puppeteer"

    /bin/bash pdf.sh "https://www.google.com/search?ncr=&q=puppeteer" pdf.pdf

EOF

    exit 1;
fi

if [ ! $# -lt 2 ] ; then

    TMPFILE="$2"
fi

docker build -t $DOCKERIMAGE .

rm -rf $TMPFILE;

docker run \
    --env P_URL="$URL" \
    --env P_TMPFILE="$TMPFILE" \
    -t \
    --rm \
    --cap-add=SYS_ADMIN \
    -v $(pwd):/app/app \
    $DOCKERIMAGE \
    node -e "$(cat script.js)"

if [ ! -f $TMPFILE ]; then

    echo "file '$TMPFILE' doesn't exist"
    
    exit 1
fi

