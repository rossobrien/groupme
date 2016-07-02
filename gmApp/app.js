/**
 * Create the main GroupMe Stats application.
 *
 * Import submodules and global libraries
 * @module ngRoute      Angular module for routing
 * @module appRoutes    Application routing config
 * @module tankApp      Module for Tank CRUD
 */
var app = angular.module('gmApp', 
	[
		'ngRoute',
		'appRoutes'
	] 
);

/**
 * Loads an entire message history for a group
 */
var messagesService = app.factory('messagesService', ['$q', '$http', function($q, $http) 
{
	var loadMessages = function(params, token, groupId)
	{
		var deferred = $q.defer();
		var messageData = { isLoaded: false, messages: [], totalCount: 0 };

		function loadAll()
		{
			//var apiURL = 'https://api.groupme.com/v3/groups/8878693/messages?token=' + token;
			//var apiURL = 'https://api.groupme.com/v3/groups/13949941/messages?token=' + token;
			//var apiURL = 'https://api.groupme.com/v3/groups/22043374/messages?token=' + token;
			var apiURL = 'https://api.groupme.com/v3/groups/'+ groupId + '/messages?token=' + token;

			$http.get(apiURL, {'params': params})
			.then(
				function(response)
				{
					messageData.messages = messageData.messages.concat(response.data.response.messages);
					messageData.totalCount = response.data.response.count;
					if (response.data.response.messages.length == 100)
					{
						params = {limit: 100, before_id: response.data.response.messages[99].id};
						loadAll();
					}
					else
					{
						deferred.resolve(messageData.messages);
					}
				}	
			);
		}
		loadAll();
		return deferred.promise;
	}

	return {
		getMessages: function(accessToken, groupId) {
			var deferred = $q.defer();

			loadMessages({limit: 100}, accessToken, groupId)
				.then(function(messages) {
					deferred.resolve(messages)
				})

			return deferred.promise;
		} 
	}

 }]);

app.controller('statsController', function($scope, $routeParams, $http, messagesService) 
{
	$scope.accessToken   = $routeParams['access_token'];
	$scope.stats         = [];
	$scope.groups        = [];
	$scope.selectedGroup = '';
	$scope.tagline       = "GroupMe Stats";
	$scope.loading       = false;
	$scope.sortType      = '';
	$scope.sortReverse   = true;

	//Groups dropdown
	$http.get('https://api.groupme.com/v3/groups?token=' + $scope.accessToken, {})
	.then(
		function(response)
		{
			$scope.groups = response.data.response;
		}	
	);

	function countLikes(messages) 
	{
		var lookup = {};
		angular.forEach(messages, function(value) {
			var messageStats = {
				name: value.name, 
				likes: value.favorited_by.length, 
				posts: 1,
				liked: 0,
				lpp: 0
			};
			if (lookup[value.user_id])
			{
				messageStats = {
					name: value.name, 
					likes: lookup[value.user_id].likes + value.favorited_by.length, 
					posts: lookup[value.user_id].posts + 1,
					liked: lookup[value.user_id].liked,
				};
				messageStats['lpp'] = messageStats['likes']/messageStats['posts'];
			}

			lookup[value.user_id] = messageStats;

			for (var i in value.favorited_by)
			{
				var user_id = value.favorited_by[i];
				if (lookup[user_id])
				{
					lookup[user_id].liked = lookup[user_id].liked + 1;
				}
			}
		});

		angular.forEach(lookup, function(item) {
			$scope.stats.push(item);
		});
	}

	$scope.getStats = function(groupId) {
		$scope.loading = true;
		$scope.stats = [];
		messagesService.getMessages($scope.accessToken, groupId).then(function(messages) {
			countLikes(messages);
			$scope.loading = false;
			if ($scope.sortType == '')
			{
				$scope.sortType = 'likes';
			}
		});
	}
});