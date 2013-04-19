# Fast Fourier Transform

This is a simple recursive implementation of the Cooley-Tukey FFT in-place algorithm.
It uses bit reversal to arrange the input array in such an order it can be calculated with a couple of iterations.

See it in action at [http://proof.github.io/fft](http://proof.github.io/fft)!

Here are some examples you can play with:

###### Sine wave at 50 Hz
x(t): sin(2 * PI * 50 * t)
sampling rate: 150
sample start time: 0
sample count: 300

###### Using Heaviside
x(t): u(t) - u(t - 4.01)
sampling rate: 10
sample start time: 0
sample count: 100

## Made using:

* [Bootstrap](http://twitter.github.io/bootstrap)
* [jQuery](http://jquery.com)
* [jQuery Flot](http://flotcharts.org)
* [Flot.Tooltip](https://github.com/krzysu/flot.tooltip)
* [arian/Complex](https://github.com/arian/Complex) library
