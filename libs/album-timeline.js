var albumTimeline = angular.module('albumApp', ['ui.bootstrap']);

albumTimeline.factory('artistService', function($http) {
    return {
        getArtist: function(artistHref) {
            return $http.get('http://ws.spotify.com/lookup/1/.json', {
                params: {
                    uri: artistHref,
                    extras: 'albumdetail'
                }
            }).then(function(artist) {
                return artist;
            });
        }
    }
});

albumTimeline.factory('addScoreService', function($http, $q) {
    return {
        populate: function(artist) {
            var albumList = artist.albums;
            var promises = albumList.map(function(album) {
                var deferred = $q.defer();

                $http.get(
                    'http://ws.spotify.com/lookup/1/.json', {
                        params: {
                            uri: album.album.href,
                            extras: 'trackdetail'
                        }
                    }).success(function(data) {
                    deferred.resolve(data);
                });

                return deferred.promise;
            });


            var isAnAlbum = function(album) {
                // console.log(album.album.name + ":" + album.score);
                if (album.trackCount < 5 || album.totalLength < 1000 || album.smellsLikeACompilation) { //Subjective call!
                    return false;
                }
                return true;
            }

            return $q.all(promises).then(function(results) {
                var returnList = results.map(function(album) {
                    var total_pop = 0;
                    var total_length = 0;
                    var track_artist_array = [];
                    // Add popularity for each track
                    $.each(album.album.tracks, function(index, track) {
                        total_pop += track.popularity * 100;
                        total_length += track.length;
                        $.each(track.artists, function(index, artist) {
                            if (!_.contains(track_artist_array, artist.href))
                                track_artist_array.push(artist.href);
                        })
                    });
                    album.score = total_pop / album.album.tracks.length;
                    album.trackCount = album.album.tracks.length;
                    album.totalLength = total_length;
                    album.smellsLikeACompilation = track_artist_array.length > 3;
                    return album;
                });
                returnList = _.filter(returnList, function(album) {
                    return album.album.availability.territories.match(/GB/) && album.info.type === 'album' && isAnAlbum(album);
                });
                artist.albums = returnList;
                return artist;
            });
        }
    }
});

albumTimeline.controller('TypeaheadCtrl', ['$scope', '$http',
    function($scope, $http) {
        $scope.getArtists = function(val) {
            return $http.get('http://ws.spotify.com/search/1/artist?', {
                params: {
                    q: val,
                }
            }).then(function(res) {
            return res.data.artists;
            });
        }
    }
]);


albumTimeline.directive('timelineviz', ['artistService', 'addScoreService',
    function(artistService, addScoreService) {
        return {
            restrict: 'E',
            //scope : {directiveArtist : artist}// selective 
            template: '<div id="vis-container"></div>',
            controller: function($scope) {},
            link: function(scope, elements, attrs) {

                scope.$watch('asyncSelected', function(asyncSelected) {
                    if (asyncSelected) {
                        console.log('loading albums...');
                        clearVisualisation();
                        artistService.getArtist(asyncSelected.href).then(function(artist) {
                            return addScoreService.populate(artist.data.artist);
                        }).then(function(artist) {
                            console.log('Loaded');
                            drawVisualisation(artist);
                        });
                    }
                });

                // handy: http://alignedleft.com/content/03-tutorials/01-d3/160-axes/5.html
                // http://alignedleft.com/tutorials/d3/axes
                drawVisualisation = function(artist) {
                    var dataset = artist.albums;

                    var width = 1000,
                        height = 400,
                        color = d3.scale.category20b();

                    var PADDING = 50;
                    var MAX_RADIUS;

                    var svg = d3.select("#vis-container")
                        .append("svg")
                        .attr("width", width)
                        .attr("height", height);

                    var lineheight = 20;
                    d3.select("#artist-name").text(artist.name);

                    var xScale = d3.scale.linear()
                        .domain([d3.min(dataset, function(d) {
                            return d.album.released;
                        }), d3.max(dataset, function(d) {
                            return d.album.released;
                        })])
                        .range([PADDING, width - PADDING * 2]);

                    var yScale = d3.scale.linear()
                        .domain([d3.min(dataset, function(d) {
                            return d.score;
                        }), d3.max(dataset, function(d) {
                            return d.score;
                        })])
                        .range([height - PADDING, PADDING]);

                    var rScale = d3.scale.linear()
                        .domain([d3.min(dataset, function(d) {
                            return d.score;
                        }), d3.max(dataset, function(d) {
                            return d.score;
                        })])
                        .range([0, 50]);

                    var opacityScale = d3.scale.linear()
                        .domain([d3.min(dataset, function(d) {
                            return d.score;
                        }), d3.max(dataset, function(d) {
                            return d.score;
                        })])
                        .range([0.9, 0.35]);

                    svg.selectAll("circle")
                        .data(dataset)
                        .enter()
                        .append("circle")
                        .attr("fill", function(d) {
                            return color(d.album.name);
                        })
                        .attr("fill-opacity", function(d) {
                            return opacityScale(d.score);
                        })
                        .attr("cx", function(d) {
                            return xScale(d.album.released);
                        })
                        .attr("cy", height)
                        .transition()
                        .duration(1500)
                        .attr("cy", function(d) {
                            // i recks would be nice if this was based on say, public popularity?... dunno, just 
                            // thinking, say, downloads vs critical review might be interesting.
                            // ... but for now, based on rScale
                            return yScale(d.score);
                        })
                        .attr("r", function(d) {
                            // will be based on score
                            return rScale(d.score);
                        });


                    svg.selectAll("text")
                        .data(dataset)
                        .enter()
                        .append("text")
                        .text(function(d) {
                            return d.album.name;
                        })
                        .attr("x", function(d) {
                            return xScale(d.album.released);
                        })
                        .attr("y", height)
                        .transition()
                        .duration(1500)
                        .attr("y", function(d) {
                            return yScale(d.score);
                        })
                        .attr("text-anchor", "middle")
                        .attr("font-family", "sans-serif")
                        .attr("font-size", "11px")
                        .attr("fill", "black");


                    // create axes
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

                clearVisualisation = function() {
                    d3.select("svg").remove();
                }
            }
        }
    }
]);