
/**
 * Define controllers and views for routes
 * 
 * @param $routeProvider    Angular route object
 * @param $locationProvider Angular module to configure URL paths
 */
angular.module('appRoutes', [])
.config(['$routeProvider', function($routeProvider, $location) 
{
	//Configure routes
	$routeProvider
		.when('/', {
			controller: 'statsController',
			templateUrl: 'views/stats.html',
		});
}]);