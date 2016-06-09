import datetime
import json
import os
import urllib2

allBlocks = []

fmt = "%Y-%m-%d"
date=datetime.datetime(2009,1,9)
oneDay = datetime.timedelta(days=1)
today = datetime.datetime.now()
yesterday = today - oneDay
rootUrl = "https://insight.bitpay.com/api/blocks?blockDate="
while date <= yesterday:
    dateStr = date.strftime(fmt)
    filename = "blocks_%s" % dateStr
    # Fetch data from internet if required
    if not os.path.isfile(filename):
        blocksUrl = rootUrl + dateStr
        print "Fetching blocks for %s from %s" % (dateStr, blocksUrl)
        response = urllib2.urlopen(blocksUrl)
        content = response.read()
        f = open(filename, 'w')
        f.write(content)
        f.close()
        # Save parsed data
        dst = open("blocks.json", 'w')
        dst.write(json.dumps(allBlocks, indent=2))
        dst.close()
    else:
        f = open(filename)
        content = f.read()
        f.close()
    # Parse the data
    data = json.loads(content)
    data["blocks"].reverse()
    for block in data["blocks"]:
        allBlocks.append({
            "height": block["height"],
            "size": block["size"],
            "time": block["time"],
            "txlength": block["txlength"],
        })
    # Prepare for next iteration
    date = date + oneDay
# Save parsed data
dst = open("blocks.json", 'w')
dst.write(json.dumps(allBlocks, indent=2))
dst.close()
