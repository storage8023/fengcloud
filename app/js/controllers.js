'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree']).
    controller('leftSidebar', function ($scope) {

        /**
         * 对获取的树数据进行再处理
         */
        var dealTreeData = function(data,type){
            var newData = [],item,dataItem;
            for(var i=0;i<data.length||0;i++){
                dataItem = data[i];
                item = {
                    label:dataItem.name,
                    data:dataItem
                }
                newData.push(item);
            }
            return newData;
        }

        /**
         * 对获取的文件数据进行再处理
         * @param fileData
         */
        var dealFileData = function(fileData){
            var newData = [],item,dataItem;
            for(var i=0;i<fileData.length||0;i++){
                dataItem = fileData[i];
                item = {
                    label:Util.String.baseName(dataItem.path),
                    data:{
                        path:dataItem.path,
                        hash:dataItem.uuidhash
                    },
                    expanded:false
                }
                newData.push(item);
            }
            return newData;
        }

        $scope.treeList = [
            { "label": "我的文件",data:{path:''},"children": dealFileData(gkClientInterface.getFileList({webpath:'',dir:1,mountid:1}),'org')},
            { "label": "团队的文件","children": dealTreeData(gkClientInterface.getSideTreeList({sidetype:'org'}),'org')},
            { "label": "其他存储", "children": dealTreeData(gkClientInterface.getSideTreeList({sidetype:'other'}),'other')},
            { "label": "智能文件夹", "children": dealTreeData(gkClientInterface.getSideTreeList({sidetype:'magic'}),'magic')}
        ];

        /**
         * 选中树节点的处理函数
         * @param node
         */
        $scope.handleSelect = function(branch){
            console.log(branch);
        }

        /**
         * 选中树节点的处理函数
         * @param node
         */
        $scope.handleExpand = function(branch){
            if(branch.expanded){
                branch.children = dealFileData(gkClientInterface.getFileList({webpath:branch.data.path,dir:1,mountid:1}));
            }
        }

    })