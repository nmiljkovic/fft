(function() {

    var log2 = function(n) {
        return Math.log(n) / Math.log(2);
    };

    var bitwise_reorder = function(x) {
        var N = x.length,
            bits = log2(N);
        var nforward, nreversed, count, temp;

        for (var n = 1; n < N - 1; n++) {  // reorganise array x[n] in bit-reversed order
            nreversed = n;
            count = bits - 1;

            for (nforward = n >> 1; nforward; nforward >>= 1) {
                nreversed <<= 1;
                nreversed |= nforward & 1; // give LSB of nforward to nreversed
                count--;
            }

            nreversed <<=count;      // compensation for missed iterations
            nreversed &= N-1;        // clear all bits more significant than N-1
            if(n < nreversed)        // swap condition
            {
               temp = x[n];
               x[n] = x[nreversed];
               x[nreversed] = temp;
            }
        }
    };

    // recursive function that first computes its left and right halves before computing itself
    // using the Cooley-Tukey FFT in-place algorithm
    // @param x      array    the discrete signal
    // @param start  integer  start element index for this iteration
    // @param N      integer  number of elements in this iteration
    // @param FN     integer  number of elements in the x array
    var internal_fft = function(x, start, N, FN) {
        if (N === 1)
            return;

        // we're constructing a butterfly
        // if this section has N elements, we'll only go through the first N / 2
        var limit = N / 2;

        // step is equal to N / 2 and is used to skip N / 2 elements from our current element
        var step = N / 2;

        // self-explanatory
        var end = start + limit;

        // calculate left and right halves first
        internal_fft(x, start, limit, FN);
        internal_fft(x, start + limit, limit, FN);

        // rotation factor 1 * exp(- j 2 pi / FN)
        var Wn = Complex.fromPolar(1, -2 * Math.PI / FN);

        // currentPower is our rotation factor power
        // starting from 0 and incrementing by FN / (2 * step) with each element
        var currentPower = 0;

        // iterate through each of the first N / 2 elements
        for (var i = start; i < end; i++, currentPower++)
        {
            var x1 = x[i];
            var x2 = x[i + step];

            // premultiply x2 with Wn^r
            var currentWn = Wn.clone().pow(currentPower * FN / (2 * step));
            x2.multiply(currentWn);

            var old_x1 = x1.clone();
            x1.add(x2);
            x2.negate().add(old_x1);
        }
    };

    var fft = function(x, N) {
        if (N === undefined)
        {
            // if no N, resize the array to the nearest higher number to our input array length
            // that is power of two
            while (log2(x.length) != Math.floor(log2(x.length)))
                x.push(0);
        }
        else
        {
            // if N is provided, no check required, just resize to N
            while (x.length != N)
                x.push(0);
        }

        bitwise_reorder(x);
        for (var i = 0; i < x.length; i++)
            x[i] = Complex.from(x[i]);

        internal_fft(x, 0, x.length, x.length);
    };

    // inverse FFT using the Cooley-Tukey FFT in-place algorithm
    // @param x      array    magnitude spectrum
    // @param start  integer  start element index for this iteration
    // @param N      integer  number of elements in this iteration
    // @param FN     integer  number of elements in the x array
    var internal_ifft = function(x, start, N, FN) {
        if (N === 1)
            return;

        // we're constructing a butterfly
        // if this section has N elements, we'll only go through the first N / 2
        var limit = N / 2;

        // step is equal to N / 2 and is used to skip N / 2 elements from our current element
        var step = N / 2;

        // self-explanatory
        var end = start + limit;

        // rotation factor 1 * exp(j 2 pi / FN)
        var Wn = Complex.fromPolar(1, 2 * Math.PI / FN);

        // currentPower is our rotation factor power
        // starting from 0 and incrementing by FN / (2 * step) with each element
        var currentPower = 0;

        var oneHalf = Complex.from(0.5);

        // iterate through each of the first N / 2 elements
        for (var i = start; i < end; i++, currentPower++)
        {
            var x1 = x[i];
            var x2 = x[i + step];

            var old_x1 = x1.clone();
            x1.add(x2).multiply(oneHalf);
            x2.negate().add(old_x1);

            // premultiply x2 with Wn^r
            var currentWn = Wn.clone().pow(currentPower * FN / (2 * step));
            x2.multiply(currentWn.multiply(oneHalf));
        }

        // recurse to calculate the left and right halves
        internal_ifft(x, start, limit, FN);
        internal_ifft(x, start + limit, limit, FN);
    };

    var ifft = function(x, N) {
        if (N === undefined)
            throw new Error("N is undefined!");

        // resize the input array to N
        while (x.length != N)
            x.push(0);

        for (var i = 0; i < x.length; i++)
            x[i] = Complex.from(x[i]);

        internal_ifft(x, 0, x.length, x.length);
        bitwise_reorder(x);
    };

    var magnitude = function(x) {
        var ret = [];
        for (var i = 0; i < x.length; i++)
            ret.push(Math.abs(x[i].magnitude()));

        return ret;
    };

	window.log2 = log2;
    window.fft = fft;
    window.ifft = ifft;
    window.magnitude = magnitude;

})();
