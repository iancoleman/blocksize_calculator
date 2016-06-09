(function() {

    var self = this;

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

    function init() {
        showDataSize();
        DOM.loadButton.addEventListener("click", loadData);
    }

    function showDataSize() {
        fetch("/data/blocks.json", {method: 'HEAD'})
            .then(function(response) {
                var sizeBytes = response.headers.get("content-length");
                var sizeMb = (sizeBytes / 1024 / 1024).toFixed(1);
                DOM.size.textContent = sizeMb + " MB";
            });
    }

    function loadData() {
        // Hide load button
        DOM.load.classList.add("hidden");
        // Show loading
        DOM.loading.classList.remove("hidden");
        fetch("data/blocks.json")
            .then(function(response) {
                if (!response.ok) {
                    // TODO report error
                    return;
                }
                response.json()
                    .then(function(data) {
                        self.data = data;
                        // Hide loading
                        DOM.loading.classList.add("hidden");
                        // Show charts
                        DOM.charts.classList.remove("hidden");
                        // Set min and max dates
                        var minDateStr = dateStr(data[0].time);
                        var maxDateStr = dateStr(data[data.length-1].time);
                        DOM.start.setAttribute("min", minDateStr);
                        DOM.start.setAttribute("max", maxDateStr);
                        DOM.start.setAttribute("value", minDateStr);
                        DOM.start.addEventListener("input", render);
                        DOM.end.setAttribute("min", minDateStr);
                        DOM.end.setAttribute("max", maxDateStr);
                        DOM.end.setAttribute("value", maxDateStr);
                        DOM.end.addEventListener("input", render);
                        render();
                    });
                });
    }

    function render() {
        // Size chart values
        sizeLabels = [];
        sizeValues = [];
        minSize = 0; // kB
        sizeStep = 100;
        maxSize = 1000; // kB
        for (var kb=minSize; kb<=maxSize; kb+=sizeStep) {
            sizeLabels.push(kb.toFixed(0) + "-" + (kb+sizeStep).toFixed(0) + " kb");
            sizeValues.push(0);
        }
        sizeLabels[sizeLabels.length-1] = (maxSize) + " kb+";
        // Txlength chart values
        txlengthLabels = [];
        txlengthValues = [];
        minTxlength = 0; // kB
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
        // Stats
        var totalBlocks = 0;
        var cumSizekb = 0;
        var cumSizetxs = 0;
        var cumTiming = 0;
        // Parse the data
        var start = new Date(DOM.start.value).getTime() / 1000;
        var end = new Date(DOM.end.value).getTime() / 1000;
        for (var i=0; i<self.data.length; i++) {
            var block = self.data[i];
            // Ignore data outside the time range
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
                var prevBlock = self.data[i-1];
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

    init();

})();
