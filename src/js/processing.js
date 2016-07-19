processing = new (function() {

    var self = this;

    var DOM = {};
    DOM.processing = select(".results .processing");
    DOM.processingRate = select(".processing .rate");
    DOM.processingPrice = select(".processing .price");
    DOM.processingErrorMsg = select(".costs .processing .error");
    DOM.processingCost = select(".processing .total");

    function calculate() {

        this.cost = 0;

        self.processingRate = parseFloat(DOM.processingRate.value);
        var processingPrice = parseFloat(DOM.processingPrice.value);
        var processingRatio = network.txsPerSecond / self.processingRate;
        var yearsPerLife = 5;
        self.cost = processingPrice * processingRatio / yearsPerLife;
        network.totalCosts += self.cost;

    }

    function render() {

        if (self.processingRate < network.txsPerSecond) {
            DOM.processingRate.classList.add("impossible");
            DOM.processingErrorMsg.classList.remove("hidden");
        }
        else {
            DOM.processingRate.classList.remove("impossible");
            DOM.processingErrorMsg.classList.add("hidden");
        }
        DOM.processing.textContent = network.txsPerSecond.toLocaleString();
        DOM.processingCost.textContent = self.cost.toLocaleString();

    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    var onInputEls = [
        DOM.processingPrice,
        DOM.processingRate,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].addEventListener("input", network.recalc);
    }

})();
