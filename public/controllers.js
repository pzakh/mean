/**
 * Created by Pavel on 6/12/2016.
 */
angular.module('myApp').controller('loginController',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            $scope.login = function () {
                $scope.error = false;
                $scope.disabled = true;
                AuthService.login($scope.loginForm.username, $scope.loginForm.password)
                    .then(function () {
                        $location.path('/chat');
                        $scope.disabled = false;
                        $scope.loginForm = {};
                    })
                    .catch(function () {
                        $scope.error = true;
                        $scope.errorMessage = "Invalid username and/or password";
                        $scope.disabled = false;
                        $scope.loginForm = {};
                    });
            };
            $scope.registration = function(){
                $location.path('/register');
            }
        }]);

angular.module('myApp').controller('logoutController',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {
            $scope.logout = function () {
                AuthService.logout()
                    .then(function () {
                        $location.path('/login');
                    });
            };
        }]);

angular.module('myApp').controller('registerController',
    ['$scope', '$location', 'AuthService',
        function ($scope, $location, AuthService) {

            $scope.register = function () {
                $scope.error = false;
                $scope.disabled = true;
                AuthService.register($scope.registerForm.username, $scope.registerForm.password)
                    .then(function () {
                        $location.path('/login');
                        $scope.disabled = false;
                        $scope.registerForm = {};
                    })
                    .catch(function () {
                        $scope.error = true;
                        $scope.errorMessage = "Something went wrong!";
                        $scope.disabled = false;
                        $scope.registerForm = {};
                    });

            };

}]);
angular.module('myApp').factory('MessageCreator', ['$http', function ($http){
    return {
        postMessage: function (message, callback) {
            $http.post('/message', message)
                .success(function(data, status){
                    callback(data, false);
                }).
            error(function(data, status) {
                callback(data, true);
            });
        }
    }
}])
angular.module('myApp').controller('ChatCtrl',
    ['$scope', 'MessageCreator','AuthService','$http', function ($scope, MessageCreator, AuthService, $http) {
    $scope.userName = '';
    $scope.message = '';
    $scope.filterText = '';
    $scope.messages = [];
    var socket = io.connect();
        $http.get('/user/current').success(function (data) {
                $scope.userName = data.username;
            });
    socket.on('receiveMessage', function (data) {
        $scope.messages.push(data);
        $scope.$apply();

        angular.element(document).ready(function () {
            $(document).scrollTop($(document).height());
        });
    });

    socket.on('pastMessages', function (data) {
        $scope.messages = data;
        $scope.$apply();

        angular.element(document).ready(function () {
            $(document).scrollTop($(document).height());

            $('.direct-chat-msg').each(function(index) {
                if ($(this).find('.direct-chat-name').text() != $('.username').text()) {
                    $(this).addClass('right');
                }
            });
        });
    });
    $scope.sendMessage = function () {
        if ($scope.userName == '') {
            window.alert('Choose a username');
            return;
        }
        if (!$scope.message == '') {
            var chatMessage = {
                'username': $scope.userName,
                'message': $scope.message
            };
            MessageCreator.postMessage(chatMessage, function (result, error) {
                if (error) {
                    window.alert('Error saving to DB');
                    return;
                }
                $scope.message = '';
            });
        }
    };
}]);
