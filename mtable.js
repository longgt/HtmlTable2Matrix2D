/**
 * MIT License
 *
 * Copyright (c) 2017 longgt
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 **/
var Table2Matrix = (function(my, $) {
    my.mtTable = (function($) {
        var mt;
        var debug;

        /**
         * Transform relative position to absolute
         */
        function r2aPosition(row, col, mt) {
            var result = col;
            var cnt = -1;
            var colCnt = mt[0].length;

            for (var i = 0; i < colCnt; i++) {
                if (mt[row][i] > 0) {
                    cnt++;
                }
                if (cnt == col) {
                    result = i;
                    break;
                }
            }
            return result;
        }

        /**
         * Transform absolute position to relative
         */
        function a2rPosition(row, col, mt) {
            var cnt = 0;

            for (var i = 0; i < col; i++) {
                if (mt[row][i] < 0) {
                    cnt++;
                }
            }
            return col - cnt;
        }

        /**
         * Detect relative cell followed by direction (for merge cell)
         */
        function detectMergeCell(row, col, direction, mt) {
            var result = [];

            if (direction == 'left') {
                if (col > 0) {
                    var colIdx = col - 1;
                    var rowIdx = row;
                    while (colIdx >= 0 && mt[rowIdx][colIdx] == -2) {
                        colIdx--;
                    }
                    while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                        rowIdx--;
                    }
                    result.push(rowIdx);
                    result.push(colIdx);
                }
            } else if (direction == 'right') {
                if (col + 1 < mt[0].length) {
                    var colIdx = col + 1;
                    var rowIdx = row;
                    while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                        rowIdx--;
                    }
                    result.push(rowIdx);
                    result.push(colIdx);
                }
            } else if (direction == 'up') {
                if (row > 0) {
                    var colIdx = col;
                    var rowIdx = row - 1;
                    while (colIdx >= 0 && mt[rowIdx][colIdx] == -2) {
                        colIdx--;
                    }
                    while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                        rowIdx--;
                    }
                    result.push(rowIdx);
                    result.push(colIdx);
                }
            } else if (direction == 'down') {
                if (row + 1 < mt.length) {
                    var colIdx = col;
                    var rowIdx = row + 1;
                    while (colIdx >= 0 && mt[rowIdx][colIdx] == -2) {
                        colIdx--;
                    }
                    result.push(rowIdx);
                    result.push(colIdx);
                }
            }
            if (result.length > 0 && result[1] >= 0) {
                result[1] = a2rPosition(result[0], result[1], mt);
            } else {
                result = [];
            }
            return result;
        }

        /**
         * Utility method for add position to result array
         * Eliminate duplicated result
         */
        function add(arr, value) {
            if (!value || value.length == 0 || value[0] < 0 || value[1] < 0) {
                return;
            }
            var existed = false;
            var length = arr.length;
            for (var i = 0; i < length; i++) {
                v = arr[i];
                if (v[0] == value[0] && v[1] == value[1]) {
                    existed = true;
                    return false;
                }
            }
            if (!existed) {
                arr.push(value);
            }
        }

        /**
         * Find previous cell on row
         */
        function prevCell(row, col, mt) {
            var result = [];
            result.push(row);

            if (col >= 0) {
                var colIdx = col;
                while (colIdx >= 0 && mt[row][colIdx] < 0) {
                    colIdx--;
                }
                result.push(colIdx >= 0 ? a2rPosition(row, colIdx, mt) : colIdx);
            } else {
                result.push(-1);
            }
            return result;
        }

        return {
            /**
             * Load table structure, convert to matrix
             */
            load: function(table, escapeCls, debug) {
                if (typeof Array.fill == 'undefined') {
                    Array.prototype.fill = function(value) {
                        var length = this.length;
                        for (var i = 0; i < length; i++) {
                            this[i] = value;
                        }
                        return this;
                    }
                }
                var $table = $(table);
                var ts = [];
                var escapeClsArr = escapeCls ? escapeCls.split(',') : [];
                $table.find('tr').each(function() {
                    var $tr = $(this);
                    var $row = [];
                    $tr.find('th,td').each(function() {
                        var $td = $(this);
                        if (escapeClsArr.length > 0) {
                            for (var i = 0, len = escapeClsArr.length; i < len; i++) {
                                if ($td.hasClass(escapeClsArr[i])) {
                                    return;
                                }
                            }
                        }
                        var $cell = [];
                        $cell.push(~~$td.attr('rowSpan') || 1);
                        $cell.push(~~$td.attr('colSpan') || 1);
                        $row.push($cell);
                    });
                    ts.push($row);
                });

                var mt = [];
                var rowCnt = ts.length;
                var colCnt = 0;

                //Get column counter in first row
                for (var i = 0, len = ts.length > 0 ? ts[0].length : 0; i < len; i++) {
                    colCnt += ts[0][i][1];
                }

                //Fill matrix with same value for each cell in row
                for (var i = 0; i < rowCnt; i++) {
                    var $row = new Array(colCnt).fill(i + 1);
                    mt.push($row);
                }
                //Figure out HTML table structure with 2D matrix
                for (var i = 0; i < rowCnt; i++) {
                    var $row = ts[i];
                    var tIndex = 0;
                    var len = $row.length;
                    for (var j = 0; j < len; j++) {
                        var $col = $row[j];
                        //Skip merged cell
                        while (mt[i][tIndex] < 0) {
                            tIndex++;
                        }
                        var rowSpan = $col[0];
                        var colSpan = $col[1];
                        //-2 indicate for colspan
                        for (var k = 1; k < colSpan; k++) {
                            mt[i][tIndex + k] = -2;
                        }
                        for (var k = 1; k < rowSpan; k++) {
                            //-1 indicate for rowspan
                            mt[i + k][tIndex] = -1;
                            for (var l = 1; l < colSpan; l++) {
                                //-2 indicate for colspan
                                mt[i + k][tIndex + l] = -2;
                            }
                        }
                        tIndex += colSpan;
                    }
                }

                this.mt = mt;
                this.debug = debug;
            },

            /**
             * Get relation cell
             * @param direction top, right, bottom, left
             */
            getRelCell: function(row, col, direction) {
                var arr = [];
                var acol = r2aPosition(row, col, this.mt);
                var rowSpan = 1;
                var colSpan = 1;
                var mt = this.mt;

                while (acol + colSpan < mt[row].length && mt[row][acol + colSpan] == -2) {
                    colSpan++;
                }
                while (row + rowSpan < mt.length && mt[row + rowSpan][acol] == -1) {
                    rowSpan++;
                }
                for (var i = 0; i < rowSpan; i++) {
                    for (var j = 0; j < colSpan; j++) {
                        if (j == 0 && direction == 'left') {
                            var ret = detectMergeCell(row + i, acol, 'left', mt);
                            add(arr, ret);
                        }
                        if (j == colSpan - 1 && direction == 'right') {
                            var ret = detectMergeCell(row + i, acol + j, 'right', mt);
                            add(arr, ret);
                        }
                        if (i == 0 && direction == 'up') {
                            var ret = detectMergeCell(row, acol + j, 'up', mt);
                            add(arr, ret);
                        }
                        if (i == rowSpan - 1 && direction == 'down') {
                            var ret = detectMergeCell(row + i, acol + j, 'down', mt);
                            add(arr, ret);
                        }
                    }
                }

                return arr;
            },

            /**
             * Get multiple relation cell
             * @param direction top, right, bottom, left
             */
            getMultiRelCell: function(lst, direction) {
                var arr = [];
                if (lst) {
                    for (var i = 0, len = lst.length; i < len; i++) {
                        var c = lst[i];
                        var ret = this.getRelCell(c[0], c[1], direction);
                        if (ret.length > 0) {
                            for (var j = 0, retLen = ret.length; j < retLen; j++) {
                                add(arr, ret[j]);
                            }
                        }
                    }
                }
                return arr;
            },

            /**
             * Get html structure (for render)
             */
            getHtmlStructure: function() {
                var ts = [];
                var mt = this.mt;
                rowCnt = mt.length;

                for (var i = 0; i < rowCnt; i++) {
                    var t = [];
                    colCnt = mt[i].length;

                    for (var j = 0; j < colCnt;) {
                        if (mt[i][j] >= 0) {
                            var colSpan = 1;
                            var rowSpan = 1;

                            while (j + colSpan < colCnt && mt[i][j + colSpan] == -2) {
                                colSpan++;
                            }
                            while (i + rowSpan < rowCnt && mt[i + rowSpan][j] == -1) {
                                rowSpan++;
                            }

                            var c = [];
                            c.push(rowSpan);
                            c.push(colSpan);
                            t.push(c);

                            j += colSpan;
                        } else {
                            j++;
                        }
                    }
                    if (t.length > 0) {
                        ts.push(t);
                    }
                }
                if (this.debug) {
                    //Debug only
                    for (var i = 0; i < mt.length; i++) {
                        var arr = [];
                        for (var j = 0; j < mt[i].length; j++) {
                            arr.push(mt[i][j] >= 0 ? (' ' + mt[i][j]) : mt[i][j]);
                        }
                        console.log(arr.join(','));
                    }
                }

                return ts;
            },

            /** 
             * Get cell in deleting column
             */
            deleteColAt: function(row, col, last) {
                var acol = r2aPosition(row, col, this.mt);
                var mt = this.mt;
                var length = mt.length;
                var result = [];

                if (last == true) {
                    while (acol + 1 < mt[row].length && mt[row][acol + 1] == -2) {
                        acol++;
                    }
                }
                for (var i = 0; i < length; i++) {
                    if (mt[i][acol] < 0) {
                        var rowIdx = i;
                        var colIdx = acol;
                        while (colIdx >= 0 && mt[rowIdx][colIdx] == -2) {
                            colIdx--;
                        }
                        while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                            rowIdx--;
                        }
                        var changed = [];
                        changed.push(rowIdx);
                        changed.push(colIdx >= 0 ? a2rPosition(rowIdx, colIdx, this.mt) : colIdx);
                        add(result, changed);
                    } else {
                        var changed = [];
                        changed.push(i);
                        changed.push(a2rPosition(i, acol, this.mt));
                        add(result, changed);
                    }
                }

                return result;
            },

            /**
             * Get cell in deleting target row
             */
            deleteRowAt: function(row) {
                var mt = this.mt;
                var length = mt.length;
                var result = [];

                if (row >= 0 && row < mt.length) {
                    for (var j = 0; j < mt[row].length; j++) {
                        if (mt[row][j] < 0) {
                            var rowIdx = row;
                            var colIdx = j;
                            while (colIdx >= 0 && mt[rowIdx][colIdx] == -2) {
                                colIdx--;
                            }
                            while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                                rowIdx--;
                            }
                            var changed = [];
                            changed.push(rowIdx);
                            changed.push(colIdx >= 0 ? a2rPosition(rowIdx, colIdx, this.mt) : colIdx);
                            add(result, changed);
                        } else {
                            var changed = [];
                            changed.push(row);
                            changed.push(a2rPosition(row, j, this.mt));
                            add(result, changed);
                        }
                    }

                }
                return result;
            },

            /**
             * Get insertable cell on next row
             */
            insertableCellNextRow: function(row, col) {
                var acol = r2aPosition(row, col, this.mt);
                var result = [];
                if (acol >= 0 && row < this.mt.length - 1) {
                    result = prevCell(row + 1, acol, this.mt);
                }
                return result;
            },

            /**
             * Get insertable cell on row
             */
            insertableCell: function(row, col) {
                var acol = r2aPosition(row, col, this.mt);
                return prevCell(row, acol, this.mt);
            },

            /** 
             * Get previous cell (also support cell with rowspan)
             */
            beforeCell: function(row, col, pRowSpan) {
                var acol = r2aPosition(row, col, this.mt);
                var mt = this.mt;
                var result = [];
                for (var i = 0; i < pRowSpan; i++) {
                    var colIdx = acol - 1;
                    var rowIdx = row + i;
                    while (colIdx >= 0 && mt[rowIdx][colIdx] < 0) {
                        colIdx--;
                    }
                    var c = [];
                    c.push(rowIdx);
                    c.push(colIdx >= 0 ? a2rPosition(rowIdx, colIdx, this.mt) : colIdx);
                    result.push(c);
                }
                return result;
            },

            /**
             * Transform column to absolute position
             */
            absoluteCol: function(row, col) {
                return r2aPosition(row, col, this.mt);
            },

            /**
             * Get row size
             */
            getRowSize: function(row) {
                var result = 0;
                if (row >= 0 && row < this.mt.length) {
                    result = this.mt[row].length;
                }
                return result;
            },

            /**
             * Check cell is exists
             */
            hasCell: function(row, col) {
                var acol = r2aPosition(row, col, this.mt);
                var result = false;
                if (row >= 0 && row < this.mt.length && acol >= 0 && acol < this.mt[row].length) {
                    result = this.mt[row][acol] > 0;
                }
                return result;
            },

            /**
             * Get table figured out matrix
             */
            getMatrix: function() {
                return this.mt;
            },

            /**
             * Extends cell by nRow and nCol more
             * In case of cell can extend, return all available cell in range, exclude current cell
             * Otherwise, throw error
             */
            extendSize: function(row, col, nRow, nCol) {
                var acol = r2aPosition(row, col, this.mt);
                var mt = this.mt;
                var result = {};
                var errorCode = 0;
                var mergeCells = [];
                var splitCells = [];

                //Detect size of current cell
                var cellRowSize = 1;
                var cellColSize = 1;
                for (var j = acol + 1; j < mt[row].length && mt[row][j] == -2; j++) {
                    cellColSize++;
                }
                for (var i = row + 1; i < mt.length && mt[i][acol] == -1; i++) {
                    cellRowSize++;
                }

                //Merge cell
                if (nRow > cellRowSize || nCol > cellColSize) {
                    //Top left
                    var topLeft = {
                        row: row,
                        col: acol
                    };

                    //Top right
                    var cnt = 1;
                    var topRight;
                    if (nCol > cellColSize) {
                        for (var j = acol + 1; j < mt[row].length; j++) {
                            if (mt[row][j] == -1) {
                                break;
                            }
                            cnt++;
                            if (cnt == nCol) {
                                topRight = {
                                    row: row,
                                    col: j
                                };
                                break;
                            }
                        }
                        if (cnt != nCol && errorCode == 0) {
                            errorCode = -1;
                        }
                    } else {
                        topRight = {
                            row: row,
                            col: acol + nCol - 1
                        };
                    }

                    //Bottom left
                    cnt = 1;
                    var bottomLeft;
                    if (nRow > cellRowSize) {
                        for (var i = row + 1; i < mt.length; i++) {
                            if (mt[i][acol] == -2) {
                                break;
                            }
                            cnt++;
                            if (cnt == nRow) {
                                bottomLeft = {
                                    row: i,
                                    col: acol
                                };
                                break;
                            }
                        }
                        if (cnt != nRow && errorCode == 0) {
                            errorCode = -2;
                        }
                    } else {
                        bottomLeft = {
                            row: row + nRow - 1,
                            col: acol
                        };
                    }


                    var maxCellBound = {
                        row: row + cellRowSize - 1,
                        col: acol + cellColSize - 1
                    };

                    //Check from bottom-left (row)
                    if (bottomLeft.row + 1 < mt.length) {
                        var nextRow = bottomLeft.row + 1;
                        for (var i = bottomLeft.col; i <= topRight.col; i++) {
                            //Check but excluding cells existed in current cell range
                            if ((nextRow > maxCellBound.row || i > maxCellBound.col) && mt[nextRow][i] == -1) {
                                errorCode = -1;
                                break;
                            }
                        }
                    }
                    //Check from top-right (column)
                    var nextCol = topRight.col + 1;
                    for (var i = topRight.row; i <= bottomLeft.row; i++) {
                        //Check but excluding cells existed in current cell range
                        if ((i > maxCellBound.row || nextCol > maxCellBound.col) && nextCol < mt[i].length && mt[i][nextCol] == -2) {
                            errorCode = -2;
                            break;
                        }
                    }

                    var bottomRight = {
                        row: bottomLeft.row,
                        col: topRight.col
                    };

                    //Get all cell in extending range
                    for (var i = topLeft.row; i <= bottomLeft.row; i++) {
                        for (var j = topLeft.col; j <= topRight.col; j++) {
                            if (mt[i][j] > 0) {
                                var c = [];
                                c.push(i);
                                c.push(a2rPosition(i, j, this.mt));
                                add(mergeCells, c);
                            }
                        }
                    }
                }
                //Split cell
                if (nRow < cellRowSize || nCol < cellColSize) {
                    for (var cntR = 0; cntR < cellRowSize; cntR++) {
                        var cnt = 0;
                        var startCell;

                        //Fill up cell with negative value in matrix after resized with positive value (insert cell)
                        if (cntR < nRow) {
                            //For missing cells only
                            cnt = cellColSize - nCol;

                            if (cnt > 0) {
                                startCell = prevCell(row + cntR, acol, mt);
                            }
                        } else {
                            //For missing row
                            cnt = cellColSize;
                            startCell = prevCell(row + cntR, acol, mt);
                        }
                        if (cnt > 0) {
                            splitCells.push({
                                row: row + cntR,
                                start: startCell,
                                howMany: cnt
                            });
                        }
                    }
                }


                result.errorCode = errorCode;
                result.mergeCells = mergeCells;
                result.splitCells = splitCells;

                return result;
            }
        }
    }(jQuery));

    return my;
}(Table2Matrix || {}, jQuery));
