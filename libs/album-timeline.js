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

   function getData(dataset) {
       $.ajax({
           url: 'http://ws.spotify.com/lookup/1/.json',
           type: 'GET',
           dataType: 'json',
           data: {
               uri: 'spotify:artist:6g0mn3tzAds6aVeUYRsryU',
               extras: 'albumdetail'
           }
       })
           .done(function(data) {
               $.each(data.artist.albums, function(index, item) {
                   getAlbumScore(item.album.href);
	           dataset.push(item.album.released);
console.log("pushing - "+ item.album.released);
               });


               var node = svg.selectAll('.album-node')
                   .data(data.artist.albums)
                   .enter()
                   .append('g')
                   .attr('class', 'album-node');

               node.append('text')
                   .attr('y', function(d, i) {
                       return lineheight * i;
                   })
                   .text(function(d) {
                       console.log(d);
                       return d.album.name;
                   });

   	       var xScale = d3.scale.linear()
		 .domain([d3.min(dataset, function(d) { return d; }), d3.max(dataset, function(d) { return d; })])
		 .range([PADDING, width - PADDING * 2]);
	       svg.selectAll("circle")
			   .data(dataset)
			   .enter()
			   .append("circle")
			   .attr("cx", function(d) {
			   		return xScale(d);
			   })
			   .attr("cy", function(d) {
					return 100;
//			   		return yScale(d[1]);
			   })
			   .attr("r", function(d) {
					return 10;
					// will be based on score
			   		//return rScale(d[1]);
			   });


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

           })
           .fail(function() {
               console.log("error");
           })
   }

   function getAlbumScore(albumHref) {
       $.ajax({
           url: 'http://ws.spotify.com/lookup/1/.json',
           type: 'GET',
           dataType: 'json',
           data: {
               uri: albumHref,
               extras: 'trackdetail'
           }
       }).done(function(data) {
           var total_pop = 0;
           // Get popularity for each track and calculate average
           $.each(data.album.tracks, function(index, track) {
               total_pop += track.popularity * 100;
           });
           console.log(total_pop);

       }).fail(function() {
           console.log("Error retrieving info for album " + albumId);
       });
   }

   getData(dataset);
