/**
 * Created with JetBrains WebStorm.
 * User: admin
 * Date: 13-10-8
 * Time: 上午9:27
 * To change this template use File | Settings | File Templates.
 */
/* news.js */
var app = angular.module("myNews",[]);


/* newsCharge */
app.controller("newsCharge",function($scope){
    $scope.xx = function() {
        $("#news-wrapper").slideUp("slow");
    }

});