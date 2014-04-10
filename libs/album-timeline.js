   var width = 1000,
       height = 700,
       color = d3.scale.category20b();

   var PADDING = 50;
   var MAX_RADIUS;

   var svg = d3.select("#container")
       .append("svg")
       .attr("width", width)
       .attr("height", height);

   var lineheight = 20;

   function getData() {
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
               var node = svg.selectAll('.album-node')
                   .data(data.artist.albums)
                   .enter()
                   .append('g')
                   .attr('class', 'album-node');

               node.append('text')
                   .attr('y', function(d, i) {
		       console.log('i=' + i);
                       return lineheight * i;
                   })
                   .text(function(d) {
                       console.log(d);
                       return d.album.name+' '+d.album.released;
                   });
           })
           .fail(function() {
               console.log("error");
           })
   }

   getData();


//function getDates() {}
