'use strict';

angular.module('gkClientLogin', ['GKCommon','ngAnimate','angular-md5','gkClientIndex.services','gkClientIndex.directives'])
    .controller('loginCtrl',['$scope','md5','GKApi','GKException',function($scope,md5,GKApi,GKException){
        $scope.step = 'login';
        $scope.registDevice = gkClientInterface.getComputerInfo()['name'];
        $scope.siteDomain = gkClientInterface.getSiteDomain();
        $scope.loading = false;
        /**
         * 登录
         */
        $scope.loginSubmit = function(){
            if($scope.loading) return;
            if(!$scope.username||!$scope.username.length){
                alert('请输入用户名或邮箱');
                return;
            }
            if(!$scope.password || !$scope.password.length){
                alert('请输入密码');
                return;
            }
            $scope.loading = true;
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
                $scope.loading = false;
                if(params.error!=0){
                    alert(params.message);
                    return;
                }else{
                    $scope.showStep('device');
                }
            })
        })

        /**
         * 注册
         */
        $scope.registSubmit = function(){
            if($scope.loading) return;
            if(!$scope.registUsername || !$scope.registUsername.length){
                alert('请输入用户名');
                return;
            }
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
            if(!Util.Validation.isRegName($scope.registUsername)){
                alert('用户名只允许使用中文汉字、英文字母、数字或下划线');
                return;
            }
            var password = $scope.registPassword;
            $scope.loading = true;
            GKApi.regist($scope.registUsername,$scope.registEmail,password,1).success(function(){
                gkClientInterface.login({
                    username:$scope.registEmail,
                    password:md5.createHash($scope.registPassword)
                });
            }).error(function(request,textStatus,errorThrown){
                    $scope.$apply(function(){
                        $scope.loading = false;
                        GKException.handleAjaxException(request,textStatus,errorThrown);
                    })
                });

        }

        $scope.setDevice = function(){
            if($scope.loading) return;
            if(!$scope.registDevice.length){
                alert('请输入设备名');
                return;
            }
            $scope.loading = true;
            gkClientInterface.setDevice({
                name:$scope.registDevice
            });
            $scope.loading = false;
        }

        $scope.handleKeyDown = function($event){
            var keyCode = $event.keyCode;
            if(keyCode == 13){
                switch($scope.step){
                    case 'login':
                        if(!$scope.username){
                            $scope.focus = 'username';
                            return;
                        }
                        if(!$scope.password){
                            $scope.focus = 'password';
                            return;
                        }
                        $scope.loginSubmit();
                        break;
                    case 'regist':
                        if(!$scope.registUsername){
                            $scope.focus = 'regist_username';
                            return;
                        }
                        if(!$scope.registPassword){
                            $scope.focus = 'regist_password';
                            return;
                        }
                        if(!$scope.registEmail){
                            $scope.focus = 'regist_email';
                            return;
                        }
                        $scope.registSubmit();
                        break;
                    case 'device':
                        if(!$scope.registDevice){
                            $scope.focus = 'regist_device';
                            return;
                        }
                        $scope.setDevice();
                        break;
                }
            }
        }
    }])
    .directive('oauthLogin', ['$timeout','GKDialog',function ($timeout,GKDialog) {
        return {
            restrict: 'E',
            template: '<ul class="c_f oauth_list"><li ng-repeat="oauth in oauthes"><a href="javascript:void(0)" ng-click="loginByOauth(oauth)" title="{{oauth.text}}"><i class="icon16x16 icon_{{oauth.name}}_color"></i></a></li></ul>',
            link: function ($scope,$element,$attrs) {
                $scope.oauthes = [];
                var oauth =['qq','sina'];
                var getOauthTextByName = function(name){
                    var text = '';
                    switch (name){
                        case 'qq':
                            text = '使用腾讯QQ帐号登录';
                            break;
                        case 'sina':
                            text = '使用新浪微博帐号登录';
                            break
                    }
                    return text;
                };
                angular.forEach(oauth,function(value){
                    $scope.oauthes.push({
                        name:value,
                        text:getOauthTextByName(value)
                    });
                })
                $scope.loginByOauth = function(oauth){
                    var key = gkClientInterface.getOauthKey();
                    var url = gkClientInterface.getSiteDomain()+'/account/oauth?oauth=' + oauth.name + '&key=' + key;
                    GKDialog.openUrl(url,{
                        width: 700,
                        height: 500
                    });
                }
            }
        };
    }])







