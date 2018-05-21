WARNING: remember about \n line ends in .sh scripts
# m h  dom mon dow   command

# examples
1 0      1 * * cd /home/example.co.uk/public_html/ && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv --- " >> ./cron/logs/monthly.log                             && /bin/bash ./cron/monthly.sh        cron 2>&1 >> ./cron/logs/monthly.log
0 0      * * 0 cd /home/example.co.uk/public_html/ && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv --- " >> ./cron/logs/sunday.log                              && /bin/bash ./cron/sunday.sh         cron 2>&1 >> ./cron/logs/sunday.log
0 0      * * * cd /home/example.co.uk/public_html/ && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv --- " >> ./cron/logs/daily_$(date +\%Y-\%m-\%d).log          && /bin/bash ./cron/daily.sh          cron 2>&1 >> ./cron/logs/daily_$(date +\%Y-\%m-\%d).log
0 */3    * * * cd /home/example.co.uk/public_html/ && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv --- " >> ./cron/logs/every3hours_$(date +\%Y-\%m-\%d).log    && /bin/bash ./cron/every3hours.sh    cron 2>&1 >> ./cron/logs/every3hours_$(date +\%Y-\%m-\%d).log
0 *      * * * cd /home/example.co.uk/public_html/ && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv --- " >> ./cron/logs/hourly_$(date +\%Y-\%m-\%d).log         && /bin/bash ./cron/hourly.sh         cron 2>&1 >> ./cron/logs/hourly_$(date +\%Y-\%m-\%d).log
*/10 *   * * * cd /home/example.co.uk/public_html/ && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv --- " >> ./cron/logs/every10minutes_$(date +\%Y-\%m-\%d).log && /bin/bash ./cron/every10minutes.sh cron 2>&1 >> ./cron/logs/every10minutes_$(date +\%Y-\%m-\%d).log
* *      * * * cd /home/example.co.uk/public_html/ && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv --- " >> ./cron/logs/everyminute_$(date +\%Y-\%m-\%d).log    && /bin/bash ./cron/everyminute.sh    cron 2>&1 >> ./cron/logs/everyminute_$(date +\%Y-\%m-\%d).log

# on prod use only this (centos 7):
SHELL=/bin/bash
PATH=/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=root

# For details see man 4 crontabs

# Example of job definition:
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed
  *  *  *  *  * root cd && . pdf-generator-service && date "+ --- vvv \%Y-\%m-\%d \%H:\%M:\%S vvv ---" >> ./cron/logs/everyminute_$(date +\%Y-\%m-\%d).log  && /bin/bash ./cron/everyminute.sh cron 2>&1 >> ./cron/logs/everyminute_$(date +\%Y-\%m-\%d).log



# to test manually:
cd && . pdf-generator-service && date "+ --- vvv %Y-%m-%d %H:%M:%S vvv ---" >> ./cron/logs/everyminute_$(date +%Y-%m-%d).log  && /bin/bash ./cron/everyminute.sh cron 2>&1 >> ./cron/logs/everyminute_$(date +%Y-%m-%d).log


# cron script triggered few times per minute:
$(for i in {1..6}; do $(/bin/bash ./cron/every10seconds.sh >> ./cron/logs/every10seconds_$(date +%Y-%m-%d).log 2>&1 &) ;sleep 10; done) &
$(for i in {1..12}; do $(/bin/bash ./cron/every5seconds.sh >> ./cron/logs/every5seconds_$(date +%Y-%m-%d).log 2>&1 &) ;sleep 5; done) &


# character ` must be escaped - what is done below
# it is possible to use $(ls -la) instead of `ls -la` but then it should be surrounded with " and leading $ should be slashed like: "\$(ls -la)"
# after all add one "\n" character
echo -e "* *    * * * /bin/bash /home/www/example.co.uk/runtime/cron/everyminute.sh cron 2>&1 >> /home/www/example.co.uk/runtime/cron/logs/everyminute_\`date +\%Y-\%m-\%d\`.log 2>&1\n0 *    * * * /bin/bash /home/www/example.co.uk/runtime/cron/hourly.sh cron 2>&1 >> /home/www/example.co.uk/runtime/cron/logs/hourly_\`date +\%Y-\%m-\%d\`.log 2>&1\n0 */3  * * * /bin/bash /home/www/example.co.uk/runtime/cron/every3hours.sh cron 2>&1 >> /home/www/example.co.uk/runtime/cron/logs/every3hours_\`date +\%Y-\%m-\%d\`.log 2>&1\n0 0    * * * /bin/bash /home/www/example.co.uk/runtime/cron/daily.sh cron 2>&1 >> /home/www/example.co.uk/runtime/cron/logs/daily.log 2>&1\n" | crontab
