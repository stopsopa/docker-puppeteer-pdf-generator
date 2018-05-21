start: stop
	node server.js --port 7777 pdf-generator-service-executed-by-make

stop:
	/bin/bash kill.sh pdf-generator-service-executed-by-make

isworking:
	/bin/bash server-is-working.sh  pdf-generator-service-executed-by-make && echo 'true' || echo 'false'
