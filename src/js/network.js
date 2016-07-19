// Access to the network parameters as entered by the user.
network = new (function() {

    var self = this;

    var DOM = {};
    DOM.size = select(".parameters .block-size");
    DOM.blocks = select(".parameters .blocks");
    DOM.time = select(".parameters .time");
    DOM.peers = select(".parameters .peers");
    DOM.nodes = select(".parameters .nodes");
    DOM.hops = select(".parameters .hops");
    DOM.blockGrammar = select(".parameters .block-grammar");
    DOM.finalTotal = select(".costs .final .total");

    DOM.bandwidthCostPercent = select(".costs .bandwidth .percent .value");
    DOM.bandwidthCostBar = select(".costs .bandwidth .bar");
    DOM.processingCostPercent = select(".costs .processing .percent .value");
    DOM.processingCostBar = select(".costs .processing .bar");
    DOM.laborCostPercent = select(".costs .labor .percent .value");
    DOM.laborCostBar = select(".costs .labor .bar");
    DOM.diskCostPercent = select(".costs .disk .percent .value");
    DOM.diskCostBar = select(".costs .disk .bar");

    function calculate() {

        self.megabytesPerBlock = parseFloat(DOM.size.value);

        self.blocksPerSecondNumerator = parseFloat(DOM.blocks.value);

        self.blocksPerSecondDenominator = parseFloat(DOM.time.value);

        self.connectedPeers = parseFloat(DOM.peers.value);

        self.totalNetworkNodes = parseFloat(DOM.nodes.value);

        self.numberOfHops = numberOfHops(self.totalNetworkNodes, self.connectedPeers);

        self.megabitsPerBlock = self.megabytesPerBlock * 8;

        self.blocksPerSecond = self.blocksPerSecondNumerator / self.blocksPerSecondDenominator;

        self.secondsPerBlock = 1 / self.blocksPerSecond;

        self.downloadPeers = 1;

        self.megabitsPerSecondDown = self.megabitsPerBlock * self.blocksPerSecond * self.downloadPeers * self.numberOfHops;

        // Upload must happen to all peers that are not downloaded from.
        self.uploadPeers = self.connectedPeers - self.downloadPeers;

        self.megabitsPerSecondUp = self.megabitsPerBlock * self.blocksPerSecond * self.uploadPeers * self.numberOfHops;

        self.megabitsPerSecondMax = Math.max(self.megabitsPerSecondUp, self.megabitsPerSecondDown);

        self.blocksPerMonth = consts.secondsPerMonth * self.blocksPerSecond;

        self.megabytesPerMonth = self.blocksPerMonth * self.megabytesPerBlock * self.connectedPeers;

        self.gigabytesPerMonth = self.megabytesPerMonth / 1000;

        self.blocksPerYear = consts.secondsPerYear * self.blocksPerSecond;

        self.megabytesPerYear = self.blocksPerYear * self.megabytesPerBlock;

        self.gigabytesPerYear = self.megabytesPerYear / 1000;

        // Must use min tx size to model worst case scenario.
        // The smaller the tx size the more txs per block and the higher the
        // required transaction processing rate.
        // Note this does not account for variation such as the mega transaction.
        // See https://rusty.ozlabs.org/?p=522
        // For the source of this block size, see
        // https://insight.bitpay.com/tx/70108ec3d588a48c825565f0ecf3f553952c7764dca7a9e8dac21d6df56948b1
        self.minTxSize = 226; // bytes

        self.bytesPerBlock = self.megabytesPerBlock * 1000 * 1000;

        self.txsPerBlock = self.bytesPerBlock / self.minTxSize;

        self.txsPerSecond = self.txsPerBlock * self.blocksPerSecond;

        self.totalCosts = 0;

    }

    ////
    // Rendering
    ////

    function render() {
        if (self.blocksPerSecondNumerator == 1) {
            DOM.blockGrammar.textContent = "block";
        }
        else {
            DOM.blockGrammar.textContent = "blocks";
        }
        DOM.hops.textContent = self.numberOfHops.toLocaleString();

        DOM.finalTotal.textContent = self.totalCosts.toLocaleString();

        // Show proportionality bars on viability costs
        var largestCost = Math.max(bandwidth.cost, processing.cost, disk.cost, labor.cost);
        var bandwidthBarSize = Math.round(bandwidth.cost / largestCost * 100) + "%";
        var bandwidthPercent = Math.round(bandwidth.cost / self.totalCosts * 100) + "%";
        DOM.bandwidthCostPercent.textContent = bandwidthPercent;
        DOM.bandwidthCostBar.style.width = bandwidthBarSize;
        var processingBarSize = Math.round(processing.cost / largestCost * 100) + "%";
        var processingPercent = Math.round(processing.cost / self.totalCosts * 100) + "%";
        DOM.processingCostPercent.textContent = processingPercent;
        DOM.processingCostBar.style.width = processingBarSize;
        var diskBarSize = Math.round(disk.cost / largestCost * 100) + "%";
        var diskPercent = Math.round(disk.cost / self.totalCosts * 100) + "%";
        DOM.diskCostPercent.textContent = diskPercent;
        DOM.diskCostBar.style.width = diskBarSize;
        var laborBarSize = Math.round(labor.cost / largestCost * 100) + "%";
        var laborPercent = Math.round(labor.cost / self.totalCosts * 100) + "%";
        DOM.laborCostPercent.textContent = laborPercent;
        DOM.laborCostBar.style.width = laborBarSize;
    }

    ////
    // Event hanlers
    ////

    var calculatedHandlers = [];

    self.addCalculatedListener = function(fn) {
        calculatedHandlers.push(fn);
    }

    self.recalc = function() {
        calculate();
        for (var i=0; i<calculatedHandlers.length; i++) {
            calculatedHandlers[i]();
        }
        render();
    }

    function numberOfHops(totalNodes, connectionsPerNode) {
        // Assuming that there are no cycles (not a good assumption).
        // Need to account for network topology.
        // The current algorithm used here is too optimistic.
        // Most likely there would be more hops than this to fully propagate.
        // eg for 8 peers per node
        // 1 hop  = 8 nodes have block data
        // 2 hops = 8*8 = 64 nodes have block data
        // 3 hops = 8*8*8 = 512
        // h hops = 8^h
        var h = Math.log(totalNodes) / Math.log(connectionsPerNode);
        return Math.ceil(h);
    }

    // Recalculate when changes are made to elements
    var onInputEls = [
        DOM.size,
        DOM.blocks,
        DOM.time,
        DOM.peers,
        DOM.nodes,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].addEventListener("input", self.recalc);
    }

})();
