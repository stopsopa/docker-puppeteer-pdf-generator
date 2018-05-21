#!/bin/bash

set -e

set -o xtrace

/bin/bash server-is-working.sh pdf-generator-service-executed-by-make || make start & disown