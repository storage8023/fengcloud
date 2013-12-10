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
                        icon:'icon_envelope_white',
                        handleClick:function(){
                            gkClientInterface.launchpad({type:'message'});
                        }
                    },
                    {
                        classes:'trasfer',
                        name:'传输',
                        icon:'icon_transfer_white',
                        handleClick:function(){
                            GKDialog.openTransfer();
                        }
                    },
                    {
                        classes:'setting',
                        name:'设置',
                        icon:'icon_setting_white',
                        handleClick:function(){
                            GKDialog.openSetting();
                        }
                    }
                ];
            }
        }
    }])

