'use strict';

/* Controllers */

angular.module('gkClientFrame.directives',[])
    .directive('qiuckmenu',['GKDialog',function(GKDialog){
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/tcframe_menu.html",
            link: function ($scope, $element) {
                $scope.menus = [
                    {
                        classes:'message',
                        name:'消息',
                        handleClick:function(){
                            gkClientInterface.lanchpad({type:'message'});
                        }
                    },
                    {
                        classes:'nearby',
                        name:'附近',
                        handleClick:function(){
                            gkClientInterface.lanchpad({type:'find'});
                        }
                    },
                    {
                        classes:'trasfer',
                        name:'传输',
                        handleClick:function(){
                            GKDialog.openTransfer();
                        }
                    },
                    {
                        classes:'setting',
                        name:'设置',
                        handleClick:function(){
                            GKDialog.openSetting();
                        }
                    }
                ];
            }
        }
    }])

