bandwidth = new (function() {

    var self = this;

    var DOM = {};
    DOM.bandwidthDown = select(".results .bandwidth .down");
    DOM.bandwidthUp = select(".results .bandwidth .up");
    DOM.dataCap = select(".results .data-cap");
    DOM.bandwidthCostRow = select(".costs .bandwidth");
    DOM.bandwidthErrorMsg = select(".costs .bandwidth .error");
    DOM.bandwidthType = select(".costs .bandwidth .type");
    DOM.unlimited = select(".costs .unlimited");
    DOM.unlimitedSpeed = select(".costs .unlimited .speed");
    DOM.unlimitedPrice = select(".costs .unlimited .price");
    DOM.unlimitedTime = select(".costs .unlimited .time");
    DOM.unlimitedSpeed = select(".costs .unlimited .speed");
    DOM.capped = select(".costs .capped");
    DOM.cappedSize = select(".costs .capped .size");
    DOM.cappedTime = select(".costs .capped .time");
    DOM.cappedPrice = select(".costs .capped .price");
    DOM.cappedSpeed = select(".costs .capped .speed");
    DOM.bandwidthCost = select(".costs .bandwidth .total");
    DOM.ibdSize = select(".initial-block-download .size");
    DOM.ibdTime = select(".initial-block-download .time");
    DOM.ibdDate = select(".initial-block-download .date");
    DOM.overlapRate = select(".costs .overlap-rate");
    DOM.overlapTime = select(".costs .overlap-time");
    DOM.hopTime = select(".costs .hop-time");
    DOM.propagateTime = select(".costs .propagate-time");

    function calculate() {

        self.cost = 0;

        self.bandwidthType = DOM.bandwidthType.value;
        self.availableSpeed = 0;
        if (self.bandwidthType == "unlimited") {
            self.availableSpeed = parseFloat(DOM.unlimitedSpeed.value);
            // calculate annual cost
            var consumptionRatio = network.megabitsPerSecondMax / self.availableSpeed;
            var unitPrice = parseFloat(DOM.unlimitedPrice.value);
            var secondsPerUnit = parseFloat(DOM.unlimitedTime.value);
            var unitsEachYear = consts.secondsPerYear / secondsPerUnit;
            self.cost = unitsEachYear * unitPrice * consumptionRatio;
        }
        else if (self.bandwidthType == "capped") {
            self.availableSpeed = parseFloat(DOM.cappedSpeed.value);
            // validate numbers
            var availableSize = parseFloat(DOM.cappedSize.value);
            var secondsPerUnit = parseFloat(DOM.cappedTime.value);
            var unitsEachDay = consts.secondsPerDay / secondsPerUnit;
            var availableEachDay = unitsEachDay * availableSize;
            self.availableEachMonth = availableEachDay * consts.daysPerMonth;
            // calculate annual cost
            var consumptionRatio = network.gigabytesPerMonth / self.availableEachMonth;
            var unitsEachYear = consts.secondsPerYear / secondsPerUnit;
            var unitPrice = parseFloat(DOM.cappedPrice.value);
            self.cost = unitsEachYear * unitPrice * consumptionRatio;
        }
        network.totalCosts += self.cost;

        // Calculate overlap rate (rate blocks might overlap each other).
        // Depends which hop the block is received.
        // The later the hop, the longer the wait.
        // The longer the wait, the bigger the chance of overlapping block.
        // Work out the chance of a block arriving for each hop.
        // Then get the average overlap rate across all hops,
        // weighted by the number of nodes in each hop.
        var cumRate = 0;
        var cumWeight = 0;
        var nodesInPastHops = 0;
        self.secondsToGetBlock = network.megabitsPerBlock / self.availableSpeed;
        for (var h=1; h<=network.numberOfHops; h++) {
            var secondsBeforeBlock = h * self.secondsToGetBlock;
            var newBlockChance = chanceOfNewBlock(secondsBeforeBlock, network.secondsPerBlock);
            var nodesLteThisHopLevel = Math.min(Math.pow(network.connectedPeers, h), network.totalNetworkNodes);
            var nodesInThisHop = nodesLteThisHopLevel - nodesInPastHops;
            var partOfHopChance = nodesInThisHop / network.totalNetworkNodes;
            var weightedChance = newBlockChance * partOfHopChance;
            cumRate += weightedChance;
            cumWeight += partOfHopChance;
            nodesInPastHops += nodesInThisHop;
        }
        var overlapRate = cumRate / cumWeight;
        self.blocksBetweenOverlap = 1 / overlapRate;
        var secondsBetweenOverlaps = self.blocksBetweenOverlap * network.blocksPerSecond;
        self.daysBetweenOverlaps = secondsBetweenOverlaps / consts.secondsPerDay;
        self.propagationTime = self.secondsToGetBlock * network.numberOfHops;

        // Initial block download - assumes all blocks full since start
        var now = new Date().getTime();
        var startOfBlockchain = new Date("2009-01-09 00:00:00").getTime();
        var timeSinceStart = (now - startOfBlockchain) / 1000;
        var blocksSinceStart = timeSinceStart / 600; // 600s per block
        var existingSize = 1 * blocksSinceStart; // 1 MB
        var futureTime = new Date(DOM.ibdDate.value).getTime();
        var timeToFuture = (futureTime - now) / 1000
        var blocksInFuture = timeToFuture / 600;
        if (blocksInFuture < 0) {
            blocksInFuture = 0;
        }
        var futureSize = network.megabytesPerBlock * blocksInFuture;
        self.ibdSize = Math.round((existingSize + futureSize) / 1024); // in GB
        var ibdSizeMegabits = self.ibdSize * 1024 * 8;
        self.ibdTime = Math.round(ibdSizeMegabits / self.availableSpeed / 3600); // in hours

    }

    function render() {

        DOM.unlimited.classList.add("hidden");
        DOM.capped.classList.add("hidden");
        if (self.bandwidthType == "unlimited") {
            // show unlimited options
            DOM.unlimited.classList.remove("hidden");
            // if impossible, show error
            if (self.availableSpeed < network.megabitsPerSecondMax) {
                DOM.unlimitedSpeed.classList.add("impossible");
                DOM.bandwidthErrorMsg.classList.remove("hidden");
            }
            else {
                DOM.unlimitedSpeed.classList.remove("impossible");
                DOM.bandwidthErrorMsg.classList.add("hidden");
            }
        }
        else if (self.bandwidthType == "capped") {
            // show capped options
            DOM.capped.classList.remove("hidden");
            // if impossible, show error
            var impossibleSize = self.availableEachMonth < network.gigabytesPerMonth;
            var impossibleSpeed = self.availableSpeed < network.megabitsPerSecondMax;
            if (impossibleSize || impossibleSpeed) {
                DOM.bandwidthErrorMsg.classList.remove("hidden");
            }
            else {
                DOM.bandwidthErrorMsg.classList.add("hidden");
            }
            if (impossibleSize) {
                DOM.cappedSize.classList.add("impossible");
            }
            else {
                DOM.cappedSize.classList.remove("impossible");
            }
            if (impossibleSpeed) {
                DOM.cappedSpeed.classList.add("impossible");
            }
            else {
                DOM.cappedSpeed.classList.remove("impossible");
            }
        }

        DOM.bandwidthDown.textContent = network.megabitsPerSecondDown.toLocaleString();
        DOM.bandwidthUp.textContent = network.megabitsPerSecondUp.toLocaleString();
        DOM.dataCap.textContent = network.gigabytesPerMonth.toLocaleString();

        DOM.overlapRate.textContent = Math.round(self.blocksBetweenOverlap);
        DOM.overlapTime.textContent = self.daysBetweenOverlaps.toLocaleString();

        DOM.hopTime.textContent = self.secondsToGetBlock.toLocaleString();
        DOM.propagateTime.textContent = self.propagationTime.toLocaleString();

        DOM.bandwidthCost.textContent = self.cost.toLocaleString();

        DOM.ibdSize.textContent = self.ibdSize.toLocaleString();
        DOM.ibdTime.textContent = self.ibdTime.toLocaleString();

    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    function chanceOfNewBlock(timeSinceLastBlock, avgBlockTime) {
        // See
        // https://en.bitcoin.it/wiki/Confirmation#Confirmation_Times
        // http://bitcoin.stackexchange.com/a/43592
        return 1 - Math.exp(-1*(timeSinceLastBlock / avgBlockTime));
    }

    onInputEls = [
        DOM.unlimitedPrice,
        DOM.unlimitedTime,
        DOM.unlimitedSpeed,
        DOM.cappedSize,
        DOM.cappedTime,
        DOM.cappedPrice,
        DOM.cappedSpeed,
        DOM.ibdDate,
    ];
    var onChangeEls = [
        DOM.bandwidthType,
        DOM.cappedTime,
        DOM.unlimitedTime,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].addEventListener("input", network.recalc);
    }
    for (var i=0; i<onChangeEls.length; i++) {
        onChangeEls[i].addEventListener("change", network.recalc);
    }

})();
