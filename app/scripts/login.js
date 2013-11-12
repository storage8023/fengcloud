'use strict';

angular.module('gkClientLogin', ['ngAnimate','angular-md5','gkClientIndex.services','gkClientIndex.directives'])
    .controller('loginCtrl',['$scope','md5','GKApi','GKException',function($scope,md5,GKApi,GKException){
        $scope.step = 'login';
        $scope.registDevice = gkClientInterface.getComputerInfo()['name'];

        $scope.siteDomain = gkClientInterface.getSiteDomain();
        /**
         * 登录
         */
        $scope.loginSubmit = function(){
            if(!$scope.username||!$scope.username.length){
                alert('请输入用户名');
                return;
            }
            if(!Util.Validation.isEmail($scope.username)){
                alert('用户名必须是有效的邮箱地址');
                return;
            }
            if(!$scope.password || !$scope.password.length){
                alert('请输入密码');
                return;
            }
            gkClientInterface.login({
                username:$scope.username,
                password:md5.createHash($scope.password)
            });

        };

        $scope.showStep = function(step){
            $scope.step = step;
        };

        /**
         * 监听登录结果的回调
         */
        $scope.$on('LoginResult',function($event,params){
            $scope.$apply(function(){
                if(params.error!=0){
                    alert(params.message);
                    return;
                }
                $scope.showStep('device');
            })
        })

        /**
         * 注册
         */
        $scope.registSubmit = function(){
            if(!$scope.registEmail || !$scope.registEmail.length){
                alert('请输入邮箱');
                return;
            }
            if(!Util.Validation.isEmail($scope.registEmail)){
                alert('请输入有效的邮箱地址');
                return;
            }
            if(!$scope.registPassword || !$scope.registPassword.length){
                alert('请输入登录密码');
                return;
            }

            if(!$scope.registUsername || !$scope.registUsername.length){
                alert('请输入你的称呼');
                return;
            }
            var password = md5.createHash($scope.registPassword);
            //$scope.step = 'device';
            GKApi.regist($scope.registUsername,$scope.registEmail,password,1).success(function(){
                gkClientInterface.login({
                    username:$scope.registEmail,
                    password:md5.createHash($scope.registPassword)
                });

            }).error(function(request){
                    GKException.handleAjaxException(request);
                });

        }

        $scope.setDevice = function(){
            if(!$scope.registDevice.length){
                alert('请输入设备名');
                return;
            }

            gkClientInterface.setDevice({
                name:$scope.registDevice
            });
        }

    }])






