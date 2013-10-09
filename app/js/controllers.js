'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', []).
    controller('leftSidebar', function ($scope) {

        /**
         *  我的文件
         * @type {Array}
         */
        $scope.myFileList = [
            { "label": "我的文件", "id": "myFileList", "children": [
                { "label" : "subUser1", "id" : "role11", "children" : [] },
                { "label" : "subUser2", "id" : "role12", "children" : [
                    { "label" : "subUser2-1", "id" : "role121", "children" : [
                        { "label" : "subUser2-1-1", "id" : "role1211", "children" : [] },
                        { "label" : "subUser2-1-2", "id" : "role1212", "children" : [] }
                    ]}
                ]}
            ]}
        ];

        /**
         * 团队的文件
         * @type {Array}
         */
        $scope.teamFileList = [
            { "label": "团队的文件", "id": "role1", "children": []}
        ];

        /**
         * 其他的存储
         * @type {Array}
         */
        $scope.otherStorageList = [
            { "label": "其他存储", "id": "role1", "children": []}
        ];

        /**
         * 智能文件夹
         * @type {Array}
         */
        $scope.smartFolderList = [
            { "label": "智能文件夹", "id": "role1", "children": []}
        ];

    })