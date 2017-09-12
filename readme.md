# Block Size Calculator

What is the effect of changing the bitcoin `MAX_BLOCK_SIZE`?

This tool helps work that out.

Hosted at [https://iancoleman.github.io/blocksize/](https://iancoleman.github.io/blocksize/)
and [https://iancoleman.github.io/blocksize/month-by-month/](https://iancoleman.github.io/blocksize/month-by-month)

## Tests

* Open page in browser
* Open developer tools to the console
* Run `test()`

## Explanation

This tool is a way to determine the effect of raising the block size.

Particularly, it helps a full node operator determine whether they are viable to continue operating.

There are some aspects of the network that are constrained by mathematics and physics - these are included in the Constraints section.

Some aspects affect the performance of the network and are determined by the economic viability for node operators. These are detailed in the Viability section. The viability parameters must be chosen by operators based on the economic constraints of each operator in their particular economic environment, and their desired functionality of the network (as constrained by the prior physical constraints).

Importantly, viability cannot be coded into the network since participation is open to all. Whether any individual participant is useful or viable is up to the participant to decide, and can not be enforced by the bitcoin software.
