/**
 * `server-only` is not a package here — Next resolves it itself. The tests run
 * outside that resolution, so this stands in for it: the guard exists to stop a
 * client BUNDLE importing the data layer, and a test process is not one.
 */
export {}
