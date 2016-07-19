disk = new (function() {

    var self = this;

    var DOM = {};
    DOM.suppliedDiskCapacity = select(".results .disk-consumption");
    DOM.diskSize = select(".costs .disk .size");
    DOM.diskPrice = select(".costs .disk .price");
    DOM.diskCost = select(".costs .disk .total");

    function calculate() {
        var diskPrice = parseFloat(DOM.diskPrice.value);
        var diskSize = parseFloat(DOM.diskSize.value) * 1000;
        var diskRatio = network.gigabytesPerYear / diskSize;
        self.cost = diskPrice * diskRatio;
        network.totalCosts += self.cost;

    }

    function render() {

        DOM.suppliedDiskCapacity.textContent = network.gigabytesPerYear.toLocaleString();
        DOM.diskCost.textContent = self.cost.toLocaleString();

    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    var onInputEls = [
        DOM.diskSize,
        DOM.diskPrice,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].addEventListener("input", network.recalc);
    }

})();
