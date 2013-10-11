'use strict';

/* Filters */

angular.module('gkClientIndex.filters', [])
    .filter('formatFileSize', function () {
        return function (filesize, dir) {
            return dir == 1 ? '-' : Util.Number.bitSize(filesize);
        }
    })

