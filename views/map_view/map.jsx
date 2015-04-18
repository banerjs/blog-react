var Map = React.createClass({
	initializeMap: function() {
        // In the case of SSR, we do not want the map to be rendered (I think).
        // In the future change this so that it is map agnostic as well
        if (!google) {
            return;
        }

        var mapOptions = {
            center: { lat: 20, lng: 0 },
            scrollwheel: false,
            zoom: 2,
            maxZoom: 7,
            minZoom: 2,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            styles: styles
        }

        var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        // Setup parameters for the data layer
        map.data.setStyle(function(feature) {
            var color = "#7e8aa2";
            var strokeWeight = 1;
            var strokeColor = "#000000";
            if (!!feature.getProperty('clicked')) {
                color = "#ff9800";
                strokeWeight = 3;
                strokeColor = "#ffffff";
            }
            return {
                strokeColor: strokeColor,
                strokeWeight: strokeWeight,
                fillColor: color,
                fillOpacity: 1
            };
        });

        map.data.addListener('mouseover', function(event) {
            if (!!event.feature.getProperty('has_posts')) {
                map.data.revertStyle();
                map.data.overrideStyle(event.feature, { fillColor: "#263248" });
            }
        });

        map.data.addListener('mouseout', function(event) {
            map.data.revertStyle();
        });

        map.data.addListener('click', function(event) {
            if (!!event.feature.getProperty('has_posts')) {
                event.feature.setProperty('clicked', !event.feature.getProperty('clicked'));
            }
        });

        return map;
	},

    refreshMapData: function() {
        this.state.map.data.addGeoJson(this.state.countries);
    },

    getInitialState: function() {
        var firebase = new Firebase('https://incandescent-fire-5437.firebaseio.com/countries');
        firebase.once("value", function(response) {
            var countries = response.val();
            var geojson = createCountriesGeoJSON(countries);
            this.setState({ countries: geojson });
        }, function(error) {
            console.error(error)
        }, this);

        // Send in a default set of values while firebase is dealing with
        // fetching the data
        return {
            countries: { "type": "FeatureCollection", "features": [] },
            maps: null
        };
    },

	componentDidMount: function() {
        this.setState({ map: this.initializeMap() });
	},

    shouldComponentUpdate: function(nextProps, nextState) {
        setTimeout(this.refreshMapData, 0);

        // This component never needs to change. Only the data passed to maps
        // needs to be updated
        return false;
    },

	render: function() {
		return (
			<section id="map" data-start="opacity: 0.75;" data-top="opacity: 1;" data-bottom="opacity: 1;" data-top-bottom="opacity: 0.1;">
				<div id="map-canvas"></div>
			</section>
		);
	}
});

// This is a style a-la Snazzy Maps
var styles = [{"featureType":"all","stylers":[{"visibility":"off"}]},{"featureType":"water","stylers":[{"visibility":"on"},{"lightness": 100}]},{"featureType":"landscape","stylers":[{"visibility": "on"},{"lightness":-100},{"saturation": 0}]}];

// This is a helper function to convert Firebase data to GEOJSON
function createCountriesGeoJSON(data) {
    var json = { "type": "FeatureCollection", "features": [] };
    Object.keys(data).map(function(country_url, idx) {
        var country = data[country_url];
        if (!!country.has_been_visited) {
            json.features.push({
                type: "Feature",
                id: idx,
                name: country.name,
                abbr: country.abbr,
                has_posts: (!!country.posts && country.posts.length > 0),
                geometry: country.geometry
            });
        }
    });
    return json
}
