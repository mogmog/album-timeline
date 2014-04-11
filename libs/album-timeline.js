var width = 1000,
    height = 400,
    color = d3.scale.category20b();

var PADDING = 50;
var MAX_RADIUS;

var svg = d3.select("#container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

var lineheight = 20;

// handy: http://alignedleft.com/content/03-tutorials/01-d3/160-axes/5.html
// http://alignedleft.com/tutorials/d3/axes
var dataset = [];
var albums = [];

function getData() {
    return $.ajax({
        url: 'http://ws.spotify.com/lookup/1/.json',
        type: 'GET',
        dataType: 'json',
        data: {
            uri: 'spotify:artist:6g0mn3tzAds6aVeUYRsryU',
            extras: 'albumdetail'
        }
    })
        .fail(function () {
            console.log("error");
        })
}

function getAlbumScore(albumHref) {
    return $.ajax({
        url: 'http://ws.spotify.com/lookup/1/.json',
        type: 'GET',
        dataType: 'json',
        data: {
            uri: albumHref,
            extras: 'trackdetail'
        }
    }).done(function (data) {
        var total_pop = 0;
        // Get popularity for each track and calculate average
        $.each(data.album.tracks, function (index, track) {
            total_pop += track.popularity * 100;
        });
        console.log("href: " + albumHref);

        console.log(total_pop);
        dataset.push([data.album.released, total_pop, data.album.name]);
        console.log("pushing - " + data.album.released + ", " + total_pop +", name, "+data.album.name);

    }).fail(function () {
        console.log("Error retrieving info for album " + albumId);
    });
}



$.when(
    // request album data
    getData())
    .then(
    // after getData()
    function (data) {
        // draw the nodes
        drawNodes(data);

        // create an array of requests to fetch album scores
        var calls = [];
        $.each(data.artist.albums, function (index, item) {
            calls.push(getAlbumScore(item.album.href));

        });

        // then apply this sequence of requests
        $.when.apply($, calls)
            .then(function (data) {
                // after the sequence of requests is complete, all
                // the data we want should be in dataset (in data[0])
                // so we can setup the axes
                console.log("------fetched album score!");
                console.log(data);
                setupAxes(data[0]);
            })
});

function drawNodes(data) {
    var node = svg.selectAll('.album-node')
        .data(data.artist.albums)
        .enter()
        .append('g')
        .attr('class', 'album-node');

    node.append('text')
        .attr('y', function (d, i) {
            return lineheight * i;
        })
        .text(function (d) {
            console.log(d);
            return d.album.name;
        });
}

function setupAxes(data) {
    var xScale = d3.scale.linear()
        .domain([d3.min(dataset, function (d) {
            return d[0];
        }), d3.max(dataset, function (d) {
            return d[0];
        })])
        .range([PADDING, width - PADDING * 2]);

    var yScale = d3.scale.linear()
        .domain([d3.min(dataset, function (d) {
            return d[1];
        }), d3.max(dataset, function (d) {
            return d[1];
        })])
        .range([height - PADDING, PADDING]);

    var rScale = d3.scale.linear()
        .domain([d3.min(dataset, function (d) {
            return d[1];
        }), d3.max(dataset, function (d) {
            return d[1];
        })])
        .range([0, 50]);

    svg.selectAll("circle")
        .data(dataset)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            console.log(">>> " + d);
            return xScale(d[0]);
        })
        .attr("cy", function (d) {
            // i recks would be nice if this was based on say, public popularity?... dunno, just thinking, say, downloads vs critical review might be interesting.
            // ... but for now, based on rScale
            return yScale(d[1]);
        })
        .attr("r", function (d) {
            // will be based on score
            return rScale(d[1]);
        });

    // this bit doesn't work atm... i just wanted to see which blobs correspond to which album to get a better understanding.
    svg.selectAll("text")
        .data(dataset)
        .enter()
        .append("text")
        .text(function(d) {
            console.log("setting text"+d[2]);
            return d[2];
        })
        .attr("x", function(d) {
            return xScale(d[0]);
        })
        .attr("y", function(d) {
            return yScale(d[1]);
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "red");


    // create axes
    console.log(dataset);
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(5)
        .tickFormat(d3.format("<"));
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height - PADDING) + ")")
        .call(xAxis);
}