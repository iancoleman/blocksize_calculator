var DOM = {};

var BYTES_PER_TX = 300;
var BLOCKS_PER_DAY = 24 * 6;

function init() {
    DOM.blocksize = document.querySelectorAll(".blocksize")[0];
    DOM.globalPopulation = document.querySelectorAll(".global-population")[0];
    DOM.transactable = document.querySelectorAll(".transactable")[0];
    DOM.useBitcoin = document.querySelectorAll(".use-bitcoin")[0];
    DOM.txPerDay = document.querySelectorAll(".tx-per-day")[0];
    DOM.details = document.querySelectorAll(".details")[0];

    DOM.globalPopulation.addEventListener("input", update);
    DOM.transactable.addEventListener("input", update);
    DOM.useBitcoin.addEventListener("input", update);
    DOM.txPerDay.addEventListener("input", update);
}

function update() {
    var globalPopulation = parseFloat(DOM.globalPopulation.value) * 1e9;
    var transactable = parseFloat(DOM.transactable.value) / 100;
    var useBitcoin = parseFloat(DOM.useBitcoin.value) / 100;
    var txPerDay = parseFloat(DOM.txPerDay.value);
    var totalTxPerDay = globalPopulation * transactable * useBitcoin * txPerDay;
    var bytesPerDay = BYTES_PER_TX * totalTxPerDay;
    var bytesPerBlock = bytesPerDay / BLOCKS_PER_DAY;
    var megabytesPerBlock = Math.round(bytesPerBlock / 1024 / 1024);
    DOM.blocksize.textContent = megabytesPerBlock.toLocaleString();
    DOM.details.href = "/blocksize/#block-size=" + megabytesPerBlock;
}

init();
update();
