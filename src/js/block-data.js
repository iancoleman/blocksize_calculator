(function() {

    var data = [];

    var DOM = {};
    DOM.loadButton = select(".load button");
    DOM.size = select(".load .size");
    DOM.load = select(".load");
    DOM.loading = select(".loading");
    DOM.charts = select(".charts");
    DOM.start = select(".start");
    DOM.end = select(".end");
    DOM.blocks = select(".stats .blocks");
    DOM.sizekb = select(".stats .sizekb");
    DOM.sizetxs = select(".stats .sizetxs");
    DOM.timing = select(".stats .timing");
    DOM.timeseries = select(".stats .timeseries");

    function init() {
        showDataSize();
        DOM.loadButton.addEventListener("click", loadData);
    }

    function showDataSize() {
        var request = new XMLHttpRequest();
        request.open("HEAD", "data/blocks.csv", true);
        request.onreadystatechange = function() {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    var sizeBytes = request.getResponseHeader("Content-Length");
                    var sizeMb = (sizeBytes / 1024 / 1024).toFixed(1);
                    DOM.size.textContent = sizeMb + " MB";
                }
            }
        }
        request.send(null);
    }

    function loadData() {

        // Hide load button
        DOM.load.classList.add("hidden");
        // Show loading
        DOM.loading.classList.remove("hidden");
        // Load the data
        Papa.parse("data/blocks.csv", {
            download: true,
            complete: function(result) {
                if (result.errors.length > 0) {
                    // TODO report error
                    return;
                }
                // Parse csv data into array of block objects
                var rows = result.data;
                var columnNames = rows[0];
                for (var i=1; i<rows.length; i++) {
                    var cells = rows[i];
                    if (cells.length != 4) {
                        continue;
                    }
                    var block = {};
                    for (var j=0; j<columnNames.length; j++) {
                        var key = columnNames[j];
                        var value = parseFloat(cells[j]);
                        block[key] = value;
                    }
                    data.push(block);
                }
                // Hide loading
                DOM.loading.classList.add("hidden");
                // Show charts
                DOM.charts.classList.remove("hidden");
                // Set min and max dates
                var minDateStr = dateStr(data[0].time);
                var maxDateStr = dateStr(data[data.length-1].time);
                DOM.start.setAttribute("min", minDateStr);
                DOM.start.setAttribute("max", maxDateStr);
                if (DOM.start.value == "") {
                    DOM.start.value = minDateStr;
                    triggerEvent(DOM.start, "input");
                }
                DOM.start.addEventListener("input", render);
                DOM.end.setAttribute("min", minDateStr);
                DOM.end.setAttribute("max", maxDateStr);
                if (DOM.end.value == "") {
                    DOM.end.value = maxDateStr;
                    triggerEvent(DOM.end, "input");
                }
                DOM.end.addEventListener("input", render);
                render();
            },
        })
    }

    function render() {
        // Size chart values
        sizeLabels = [];
        sizeValues = [];
        minSize = 0; // KB
        sizeStep = 100;
        maxSize = 1000; // KB
        for (var kb=minSize; kb<=maxSize; kb+=sizeStep) {
            sizeLabels.push(kb.toFixed(0) + "-" + (kb+sizeStep).toFixed(0) + " KB");
            sizeValues.push(0);
        }
        sizeLabels[sizeLabels.length-1] = (maxSize) + " KB+";
        // Txlength chart values
        txlengthLabels = [];
        txlengthValues = [];
        minTxlength = 0; // KB
        var maxTxlength = 3000;
        txlengthStep = Math.ceil(maxTxlength / 10);
        for (var txs=0; txs<=maxTxlength; txs+=txlengthStep) {
            txlengthLabels.push(txs.toFixed(0) + "-" + (txs+txlengthStep).toFixed(0) + " txs");
            txlengthValues.push(0);
        }
        txlengthLabels[txlengthLabels.length-1] = (maxTxlength) + " txs+";
        // Timing chart values
        timingLabels = [];
        timingValues = [];
        timingStep = 100;
        var minTiming = -100; // Block times are not always sequential
        var maxTiming = 20*60;
        for (var tm=minTiming; tm<=maxTiming; tm+=timingStep) {
            timingLabels.push(tm.toFixed(0) + "-" + (tm+timingStep).toFixed(0) + "s");
            timingValues.push(0);
        }
        timingLabels[0] = "< 0s";
        timingLabels[timingLabels.length-1] = (maxTiming) + "s+";
        //  Timeseries values
        var tsLabels = [];
        var tsMedianSize = [];
        var tsMeanSize = [];
        var tsMaxSize = [];
        var tsMeanTime = [];
        var thisMonthSizes = [];
        var thisMonthTimes = [];
        // Stats
        var totalBlocks = 0;
        var cumSizekb = 0;
        var cumSizetxs = 0;
        var cumTiming = 0;
        // Parse the data
        var start = new Date(DOM.start.value).getTime() / 1000;
        var end = new Date(DOM.end.value).getTime() / 1000;
        var firstDate = new Date(data[0].time * 1000);
        var firstMonth = monthForDate(firstDate);
        for (var i=0; i<data.length; i++) {
            var block = data[i];
            // Timeseries data
            var blockDate = new Date(block.time * 1000);
            var thisMonth = monthForDate(blockDate);
            var monthIndex = thisMonth - firstMonth;
            if (monthIndex > tsMedianSize.length || i == data.length-1) {
                // Month has ended, put past month into time series
                thisMonthSizes.sort(function(a,b) { return a-b });
                var medianSize = median(thisMonthSizes);
                tsMedianSize.push({ x: monthIndex, y: medianSize });
                var meanSize = mean(thisMonthSizes);
                tsMeanSize.push({ x: monthIndex, y: meanSize });
                var maxSize = thisMonthSizes[thisMonthSizes.length - 1];
                tsMaxSize.push({ x: monthIndex, y: maxSize });
                var meanTime = mean(thisMonthTimes);
                tsMeanTime.push({ x: monthIndex, y: meanTime });
                tsLabels.push(dateStr(prevBlock.time).substring(0,7));
                // Reset monthly stats
                thisMonthSizes = [];
                thisMonthTimes = [];
            }
            // accumulate data for this month
            thisMonthSizes.push(parseFloat(block.size) / 1000);
            if (i > 0) {
                var prevBlock = data[i-1];
                var time = block.time - prevBlock.time;
                thisMonthTimes.push(time);
            }
            // Ignore data outside the time range for histograms
            if (block.time < start || block.time > end) {
                continue;
            }
            // Total Blocks stat
            totalBlocks += 1;
            // Size
            var sizekb = block.size / 1000;
            var sizeBucket = Math.round(sizekb / sizeStep);
            sizeValues[sizeBucket] += 1;
            cumSizekb += sizekb;
            // Txlength
            var txlength = block.txlength;
            if (txlength > maxTxlength) {
                txlength = maxTxlength;
            }
            var txlengthBucket = Math.round(txlength / txlengthStep);
            txlengthValues[txlengthBucket] += 1;
            cumSizetxs += txlength;
            // Timing
            if (i > 0) {
                var prevBlock = data[i-1];
                var timing = block.time - prevBlock.time;
                if (timing > maxTiming) {
                    timing = maxTiming;
                }
                if (timing < minTiming) {
                    timing = minTiming;
                }
                var timingBucket = Math.round((timing - minTiming) / timingStep);
                timingValues[timingBucket] += 1;
                cumTiming += timing;
            }
        }
        // Chart the size
        var size = select(".chart .size");
        size.innerHTML = "";
        var sizeCanvas = document.createElement("canvas");
        size.appendChild(sizeCanvas);
        new Chart(sizeCanvas, {
            type: 'bar',
            data: {
                labels: sizeLabels,
                datasets: [{
                    label: 'Blocks of this size',
                    data: sizeValues,
                }],
            },
        });
        // Chart the txlength
        var txlength = select(".chart .txlength");
        txlength.innerHTML = "";
        var txlengthCanvas = document.createElement("canvas");
        txlength.appendChild(txlengthCanvas);
        new Chart(txlengthCanvas, {
            type: 'bar',
            data: {
                labels: txlengthLabels,
                datasets: [{
                    label: 'Blocks with this many txs',
                    data: txlengthValues,
                }],
            },
        });
        // Chart the timing
        var timing = select(".chart .timing");
        timing.innerHTML = "";
        var timingCanvas = document.createElement("canvas");
        timing.appendChild(timingCanvas);
        var size = new Chart(timingCanvas, {
            type: 'bar',
            data: {
                labels: timingLabels,
                datasets: [{
                    label: 'Blocks this far apart',
                    data: timingValues,
                }],
            },
        });
        // Chart the time series
        var timeseries = select(".chart .timeseries");
        timeseries.innerHTML = "";
        var timeseriesCanvas = document.createElement("canvas");
        timeseries.appendChild(timeseriesCanvas);
        var maxSizeColor = "#D62728";
        var meanSizeColor = "#FF7F0E";
        var medianSizeColor = "#2CA02C";
        var meanTimeColor = "#1F77B4";
        var size = new Chart(timeseriesCanvas, {
            type: 'line',
            data: {
                labels: tsLabels,
                datasets: [
                    {
                        label: 'Max Size',
                        data: tsMaxSize,
                        fill: false,
                        borderColor: maxSizeColor,
                        pointBorderColor: maxSizeColor,
                        pointBackgroundColor: maxSizeColor,
                        backgroundColor: maxSizeColor,
                        pointRadius: 1,
                    },
                    {
                        label: 'Mean Size',
                        data: tsMeanSize,
                        fill: false,
                        borderColor: meanSizeColor,
                        pointBorderColor: meanSizeColor,
                        pointBackgroundColor: meanSizeColor,
                        backgroundColor: meanSizeColor,
                        pointRadius: 1,
                    },
                    {
                        label: 'Median Size',
                        data: tsMedianSize,
                        fill: false,
                        borderColor: medianSizeColor,
                        pointBorderColor: medianSizeColor,
                        pointBackgroundColor: medianSizeColor,
                        backgroundColor: medianSizeColor,
                        pointRadius: 1,
                    },
                    {
                        label: 'Mean Time',
                        data: tsMeanTime,
                        fill: false,
                        borderColor: meanTimeColor,
                        pointBorderColor: meanTimeColor,
                        pointBackgroundColor: meanTimeColor,
                        backgroundColor: meanTimeColor,
                        pointRadius: 1,
                    },
                ],
            },
            options: {
                scales: {
                    yAxes: [{
                        type: 'linear',
                    }]
                }
            }
        });
        // Stats
        var avgSizekb = (cumSizekb / totalBlocks).toFixed(0);
        var avgSizetxs = (cumSizetxs / totalBlocks).toFixed(0);
        var avgTiming = (cumTiming / (totalBlocks - 1)).toFixed(0);
        DOM.blocks.textContent = totalBlocks;
        DOM.sizekb.textContent = avgSizekb;
        DOM.sizetxs.textContent = avgSizetxs;
        DOM.timing.textContent = avgTiming;
    }

    function dateStr(unixTime) {
        var d = new Date(unixTime * 1000);
        return d.toISOString().substring(0, 10);
    }

    function triggerEvent(element, eventName) {
        if ("createEvent" in document) {
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent(eventName, false, true);
            element.dispatchEvent(evt);
        }
        else {
            element.fireEvent("on" + eventName);
        }
    }

    function monthForDate(d) {
        return d.getYear() * 12 + d.getMonth();
    }

    function mean(a) {
        var total = 0;
        for (var i=0; i<a.length; i++) {
            total += a[i];
        }
        return total / a.length;
    }

    function median(a) {
        if (a.length < 1) {
            return 0;
        }
        if (a.length % 2 == 0) {
            var lo = a[a.length / 2 - 1];
            var hi = a[a.length / 2];
            return (lo + hi) / 2;
        }
        else {
            return a[Math.floor(a.length / 2)]
        }
    }

    init();

})();
