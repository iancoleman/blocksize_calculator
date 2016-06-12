var chart = document.getElementById("chart");
var monthSelector = document.getElementById("month");

var blocks = [];
var monthlyHistograms = [];
var firstMonth = 0;

Chart.defaults.global.animation.duration = 0;

function monthForDate(d) {
    return (d.getUTCFullYear()) * 12 + d.getUTCMonth();
}

function dateStr(d) {
    return d.toISOString().substring(0, 7);
}

function showMonth(monthIndex) {
    var histogram = monthlyHistograms[monthIndex];
    var dataset = histogram.datasets[0];
    var bins = dataset.data;
    // Calculate title - month
    var year = Math.floor(firstMonth / 12);
    var monthStr = dateStr(new Date(year, monthIndex + 1));
    // Calculate title - blocks
    var totalBlocks = 0;
    for (var i=0; i<bins.length; i++) {
        totalBlocks += bins[i];
    }
    // Normalize data
    var normHistogram = {};
    normHistogram.labels = histogram.labels;
    normHistogram.datasets = [{
        label: dataset.label,
    }];
    var normBins = [];
    for (var i=0; i<bins.length; i++) {
        normBins.push(Math.round(bins[i] / totalBlocks * 100));
    }
    normHistogram.datasets[0].data = normBins;
    // Clear old graph
    chart.innerHTML = "";
    var canvas = document.createElement("canvas");
    chart.appendChild(canvas);
    new Chart(canvas, {
        type: 'bar',
        data: normHistogram,
        options: {
            title: {
                display: true,
                text: "Block Size - " + monthStr + " - " + totalBlocks + " blocks",
            },
            scales: {
                yAxes: [{
                    ticks: {
                        min: 0,
                        max: 100,
                    },
                }],
            },
        }
    });
}

function toHistogram(a) {
    var min = -100;
    var max = 1200;
    var range = max - min;
    var step = 100;
    var bins = [];
    var labels = [];
    // Generate bins
    for (var i=min; i<=max; i+=step) {
        var label = i + " - " + (i+step) + " KB";
        labels.push(label);
        bins.push(0);
    }
    labels[0] = "< " + (min+step);
    labels[labels.length-1] = max + "+ KB";
    // Populate bins
    for (var i=0; i<a.length; i++) {
        // Validate value
        var p = a[i];
        if (p > max) {
            p = max;
        }
        if (p < min) {
            p = min;
        }
        // Put in bin
        var binIndex = Math.round(((p - min) / range) * (bins.length-1));
        bins[binIndex] += 1;
    }
    // Return chartable format
    var response = {
        labels: labels,
        datasets: [{
            label: "% of blocks",
            data: bins,
        }],
    };
    return response;
}

// Load the data
Papa.parse("../data/blocks.csv", {
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
                if (key == "time") {
                    value = new Date(value * 1000);
                }
                block[key] = value;
            }
            blocks.push(block);
        }
        // Parse blocks into monthly bins
        firstMonth = monthForDate(blocks[0].time);
        var thisMonthSizes = [];
        for (var i=0; i<blocks.length; i++) {
            var block = blocks[i];
            var thisMonth = monthForDate(block.time);
            var monthIndex = thisMonth - firstMonth;
            if (monthIndex > monthlyHistograms.length) {
                // Create histogram
                var monthlyHistogram = toHistogram(thisMonthSizes);
                monthlyHistograms.push(monthlyHistogram);
                // reset monthly sizes
                thisMonthSizes = [];
            }
            thisMonthSizes.push(block.size / 1000);
        }
        // Chart first month
        showMonth(0);
        // Set slider
        monthSelector.setAttribute("min", 0);
        monthSelector.setAttribute("max", monthlyHistograms.length-1);
        monthSelector.style.display = "block";
        monthSelector.addEventListener("input", function() {
            var monthIndex = parseFloat(monthSelector.value);
            showMonth(monthIndex);
        });
        monthSelector.focus();
    }
});
