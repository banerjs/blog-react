// Homepage
var React = require('react');

var Homepage = React.createClass({
	contextTypes: {
		router: React.PropTypes.func
	},

	render: function() {
		return (
			<main className="container-fluid">
			</main>
		);
	}
});

module.exports = Homepage;
