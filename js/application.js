$(function() {
    // cache some elements
    var showOff = $('.showoff');
    var drawButton = $('#draw');
    var parametersForm = $('.parameters-form');

    // Heaviside step function, must be global
    var u = function(t) {
        return t >= 0 ? 1 : 0;
    };

    // Dirac delta function
    var delta = function(t) {
        var alpha = 1/10000;
        return 1 / (alpha * Math.PI) * Math.exp(-t * t / (alpha * alpha));
    };

    window.u = u;
    window.delta = delta;

    // returns a function that accepts a parameter 't' which presents our equation
    var calculate_equation = function(equation) {
        var fn = null;
        try {
            equation = equation.replace(/(a?sin|a?cos|a?tan|exp|log|pow|sqrt|PI|SQRT2)/g, "Math.$1");
            equation = equation.replace(/document|window/g, '');   // we evaluate this expression
            fn = Function('t', 'return ' + equation + ';');
        }
        catch (e) {
            // catch any SyntaxError exceptions
            return null;
        }
        return fn;
    };

    // the back button on our presentation page handler
    var backHandler = function(e) {
        e.preventDefault();

        showOff.animate({ left: -3000, opacity: 0 }, 1000, function() {
            showOff.hide();
            parametersForm.css({ left: -3000, opacity: 0 });
            parametersForm.show();
            parametersForm.animate({ left: 0, opacity: 1 }, 1000);
        });
    };

    drawButton.on('click', function(e) {
        e.preventDefault();

        // read the parameters from the form
        var x_t = $('#equation').val();
        var sampling_rate = parseFloat( $('#sampling-rate').val(), 10 );
        var sample_start_time = parseFloat( $('#sample-start-time').val(), 10 );
        var sample_count = parseInt( $('#sample-count').val(), 10 );
        var fft_terms = parseInt( $('#fft-terms').val(), 10 );

        // hide all previously shown popovers
        $('.add-popover').popover('hide');

        var calculate_fn = calculate_equation(x_t);
        if (calculate_fn === null)
        {
            $('#equation').focus().popover('show');
            return;
        }

        // sampling rate is required and must be greater than 0
        if (isNaN(sampling_rate) || sampling_rate <= 0)
        {
            $('#sampling-rate').focus().popover('show');
            return;
        }

        // sample start time rate is required
        if (isNaN(sample_start_time))
        {
            $('#sample-start-time').focus().popover('show');
            return;
        }

        // sample count is required and must be greater than 0
        if (isNaN(sample_count) || sample_count <= 0)
        {
            $('#sample-count').focus().popover('show');
            return;
        }

        // if number of fft terms is present and it's either less than our sample count or not power of two
        // show an error
        if (!isNaN(fft_terms) && (fft_terms < sample_count || log2(fft_terms) !== Math.floor(log2(fft_terms))))
        {
            $('#fft-terms').focus().popover('show');
            return;
        }

        // define start and end sample times
        var t_start = sample_start_time;
        var t_end = t_start + (sample_count - 1)/sampling_rate;

        // current t in the for loops
        var t;

        // continuous signal graph
        var x_t_continuos = [];
        for (t = t_start; t <= t_end; t += 0.001)
            x_t_continuos.push([t, calculate_fn(t)]);

        // discrete signal graph
        var x_discrete = [];
        var i = 0;
        for (t = t_start; t <= t_end; t += 1/sampling_rate)
            x_discrete.push([i++, calculate_fn(t)]);

        // copy the discretized signal because our fft function is in-place
        var magnitude_spectrum = [];
        for (i = 0; i < x_discrete.length; i++)
            magnitude_spectrum.push(x_discrete[i][1]);

        if (fft_terms === 0 || isNaN(fft_terms))
            fft(magnitude_spectrum);
        else
            fft(magnitude_spectrum, fft_terms);

        // we're not interested in complex numbers - abs(fft(x, N))
        magnitude_spectrum_abs = magnitude(magnitude_spectrum);

        // populate the final parameters fields
        $('.parameters-final').html(__template('#parameters', {
            equation: x_t,
            sampling_rate: sampling_rate,
            t_start: t_start,
            t_end: t_end,
            sample_count: sample_count,
            fft_terms: magnitude_spectrum.length
        })).find('.back').on('click', backHandler);

        // animate the parameters form
        parametersForm.animate({ left: -3000, opacity: 0 }, 1000, function() {
            parametersForm.hide();

            // we need to offset the presentation div so we can show it and draw before animating
            showOff.css({ left: -3000, opacity: 0 });
            showOff.show();

            // gogo!
            draw_graphs(t_start, t_end, sampling_rate, sample_count, x_t_continuos, x_discrete, magnitude_spectrum_abs);
            showOff.animate({ left: 0, opacity: 1 }, 1000);
        });
    });

    var draw_graphs = function(t_start, t_end, sampling_rate, sample_count, x_t_continuos, x_discrete, mag_spectrum)
    {
        $.plot('#original-signal', [{
            label: "x(t)",
            data: x_t_continuos,
            color: 2,
            lines: { show: true, fill: true }
        }], {
            grid: { hoverable: true },
            yaxis: {
                tickDecimals: 2
            },
            xaxis: {
                tickDecimals: 2
            },
            tooltip: true,
            tooltipOpts: {
                content: "t: %x s , x(t): %y"
            }
        });

        $.plot('#discrete-signal', [{
            label: 'x(t<sub>s</sub> + k/f<sub>s</sub>)',
            data: x_discrete,
            color: 2,
            points: { show: true },
            bars: { show: true, lineWidth: 0.05, barWidth: 0.05, align: 'center' }
        }], {
            grid: { hoverable: true },
            yaxis: {
                tickDecimals: 2
            },
            tooltip: true,
            tooltipOpts: {
                content: "t: %x s , x(t): %y"
            }
        });

        // process the magnitude spectrum
        var magnitude_spectrum = [];
        for (var i = 0; i < mag_spectrum.length / 2; i++)
        {
            magnitude_spectrum.push([
                i / mag_spectrum.length * sampling_rate,    // x label [Hz]
                1 / sampling_rate * mag_spectrum[i]         // correct amplitude by multiplying with T
            ]);
        }

        $.plot('#magnitude-spectrum', [{
            label: '|X(f)|',
            data: magnitude_spectrum,
            color: 2,
            points: { show: true },
            bars: { show: true, lineWidth: 0.05, barWidth: 0.05, align: 'center' }
        }], {
            grid: { hoverable: true },
            yaxis: {
                tickDecimals: 2
            },
            tooltip: true,
            tooltipOpts: {
                content: "f: %x Hz , |X(f)|: %y"
            }
        });
    };

    // quick and dirty template because I'm lazy to download handlebars
    var __template = function(id, ctx) {
        var html = $(id).html();

        for (var key in ctx) {
            if (!ctx.hasOwnProperty(key))
                return;

            html = html.replace('$' + key, ctx[key]);
        }

        return html;
    };

    $('.add-popover').popover({
        html: true,
        trigger: 'manual'
    });

});
