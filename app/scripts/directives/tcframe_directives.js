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
                        name:'讨论',
                        icon:'icon_message',
                        handleClick:function(){
                            GKDialog.chat();
                        }
                    },
                    {
                        classes:'chat',
                        name:'消息',
                        icon:'icon_ring',
                        handleClick:function(){
                            gkClientInterface.launchpad({type:'message'});
                        }
                    },
                    {
                        classes:'trasfer',
                        name:'传输',
                        icon:'icon_transfer',
                        handleClick:function(){
                            GKDialog.openTransfer();
                        }
                    },
                    {
                        classes:'setting',
                        name:'设置',
                        icon:'icon_setting',
                        handleClick:function(){
                            GKDialog.openSetting();
                        }
                    }
                ];
            }
        }
    }])

