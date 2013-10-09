'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree']).
    controller('leftSidebar', function ($scope) {

        /**
         *  我的文件
         * @type {Array}
         */
        $scope.myFileList = [
            { "label": "我的文件","children": [
                { "label" : "subUser1", "children" : [] },
                { "label" : "subUser2",  "children" : [
                    { "label" : "subUser2-1", "children" : [
                        { "label" : "subUser2-1-1", "children" : [] },
                        { "label" : "subUser2-1-2", "children" : [] }
                    ]}
                ]}
            ]}
        ];

        /**
         * 团队的文件
         * @type {Array}
         */
        $scope.teamFileList = [
            { "label": "团队的文件","children": []}
        ];

        /**
         * 其他的存储
         * @type {Array}
         */
        $scope.otherStorageList = [
            { "label": "其他存储", "children": []}
        ];

        /**
         * 智能文件夹
         * @type {Array}
         */
        $scope.smartFolderList = [
            { "label": "智能文件夹", "children": []}
        ];

    })