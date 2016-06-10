import datetime
import json
import os
import urllib2

# Save parsed data
outputFilename = "blocks.csv"
outputFile = open(outputFilename, 'w')
outputFile.write("height,size,time,txlength\n");
outputFile.close()

fmt = "%Y-%m-%d"
date=datetime.datetime(2009,1,9)
oneDay = datetime.timedelta(days=1)
today = datetime.datetime.now()
yesterday = today - oneDay
rootUrl = "https://insight.bitpay.com/api/blocks?blockDate="
while date <= yesterday:
    dateStr = date.strftime(fmt)
    filename = "blocks_%s" % dateStr
    # Fetch data
    if not os.path.isfile(filename):
        # from internet
        blocksUrl = rootUrl + dateStr
        print "Fetching blocks for %s from %s" % (dateStr, blocksUrl)
        response = urllib2.urlopen(blocksUrl)
        content = response.read()
        f = open(filename, 'w')
        f.write(content)
        f.close()
    else:
        # from local cached file
        f = open(filename)
        content = f.read()
        f.close()
    # Parse data
    data = json.loads(content)
    data["blocks"].reverse()
    outputFile = open(outputFilename, 'a')
    for block in data["blocks"]:
        row = "%s,%s,%s,%s\n" % (
            block["height"],
            block["size"],
            block["time"],
            block["txlength"],
        )
        # Save the data
        outputFile.write(row)
    outputFile.close()
    # Prepare for next iteration
    date = date + oneDay
