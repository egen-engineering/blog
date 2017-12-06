import { Downsample } from './downsampling-algo.js';
import data from './config.js';

export class Demo {
    drawCharts() {
        var downsampledData = new Downsample().largestTriangleThreeBuckets(data, 100);
        var outliersPoints = _.map(downsampledData, function(d) {
            return d.x;
        });

        this.drawLineChart('.original-chart', data, outliersPoints);
        this.drawLineChart('.downsampled-chart', downsampledData);
    }

    drawLineChart(container, data, outliers) {
        var svg = d3.select(container).append("svg")
            .attr("width", 960)
            .attr("height", 500);

        var margin = {top: 20, right: 20, bottom: 30, left: 50},
            width = 960 - margin.left - margin.right,
            scrubberHeight = 50,
            height = 500 - margin.top - scrubberHeight;

        // set the ranges
        var x = d3.scaleTime().range([0, width]);
        var brushX = d3.scaleTime().range([0, width]);
        var y = d3.scaleLinear().range([height, 0]);

        // define the line
        var line = d3.line()
            .x(function(d) { return x(d.x); })
            .y(function(d) { return y(d.y); });

        var brush = d3.brushX()
            .extent([
                [0, 0],
                [width, scrubberHeight]
            ])
            .on("brush end", brushed);

        var chart = svg.append("g")
                            .attr('class','chart')
                            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var scrubber = svg.append("g")
                             .attr("class", "scrubber")
                             .attr("transform", "translate(" + margin.left + "," + (margin.top + height) + ")");

        // Scale the range of the data
        x.domain(d3.extent(data, function(d) { return d.x; }));
        brushX.domain(x.domain());
        y.domain([0, d3.max(data, function(d) { return d.y; })]);

        // Add the valueline path.
        chart.append('clipPath')
            .attr('id','clip')
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        // Add the valueline path.
        chart.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", line)
            .attr('clip-path', 'url(#clip)');

        // Add the X Axis
        chart.append("g")
            .attr('class','axis--x')
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add the Y Axis
        chart.append("g")
            .call(d3.axisLeft(y));

        scrubber.append("g")
            .attr("class", "brush")
            .call(brush)
            .call(brush.move, x.range());

        // Add the brush X Axis
        scrubber.append("g")
            .attr('class','axis--x')
            .attr("transform", "translate(0," + scrubberHeight + ")")
            .call(d3.axisTop(x).tickSize(0));

        if (_.size(outliers)) {
            chart.selectAll('.marker')
                .data(outliers)
                .enter()
                .append('circle')
                .attr('class', 'marker')
                .attr('cx', function(d){
                    return x(d);
                })
                .attr('cy', function(d) {
                    return y(_.find(data, { x: d }).y);
                })
                .attr('r', 3)
                .attr('fill', 'red')
                .attr('clip-path', 'url(#clip)');
        }

        function brushed() {
            var s = d3.event.selection || brushX.range();

            if (_.isNull(d3.event.selection)){
                scrubber.select('.brush')
                        .call(brush.move, x.range());
            }

            x.domain(s.map(brushX.invert, brushX));
            chart.select(".line").attr("d", line);
            chart.selectAll(".marker")
                .attr("cx", function(d) {
                    return x(d);
                });
            chart.select(".axis--x").call(d3.axisBottom(x));
        }
    }
}