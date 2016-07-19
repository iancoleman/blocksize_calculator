labor = new (function() {

    var self = this;

    var DOM = {};
    DOM.laborHours = select(".labor .hours");
    DOM.laborPrice = select(".labor .price");
    DOM.laborCost = select(".labor .total");

    function calculate() {

        self.cost = 0;

        var laborPrice = parseFloat(DOM.laborPrice.value);
        var laborHours = parseFloat(DOM.laborHours.value);
        self.cost = laborPrice * laborHours;
        network.totalCosts += self.cost;

    }

    function render() {
        DOM.laborCost.textContent = self.cost.toLocaleString();
    }

    network.addCalculatedListener(function() {
        calculate();
        render();
    });

    var onInputEls = [
        DOM.laborHours,
        DOM.laborPrice,
    ];
    for (var i=0; i<onInputEls.length; i++) {
        onInputEls[i].addEventListener("input", network.recalc);
    }

})();
