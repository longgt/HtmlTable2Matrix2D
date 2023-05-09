/**
 * @license MIT License
 *
 * Copyright (c) 2023 longgt
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
(function() {
    let my = {};
    my.mtTable = (function() {
        let mt;
        let debug;

        /**
         * Transform relative position to absolute
         */
        function r2aPosition(row, col, mt) {
            let result = col;
            let cnt = -1;
            let colCnt = mt[0].length;

            for (let i = 0; i < colCnt; i++) {
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
            let cnt = 0;

            for (let i = 0; i < col; i++) {
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
            let result = [];

            if (direction == 'left') {
                if (col > 0) {
                    let colIdx = col - 1;
                    let rowIdx = row;
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
                    let colIdx = col + 1;
                    let rowIdx = row;
                    while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                        rowIdx--;
                    }
                    result.push(rowIdx);
                    result.push(colIdx);
                }
            } else if (direction == 'up') {
                if (row > 0) {
                    let colIdx = col;
                    let rowIdx = row - 1;
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
                    let colIdx = col;
                    let rowIdx = row + 1;
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
            let existed = false;
            let length = arr.length;
            for (let i = 0; i < length; i++) {
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
            let result = [];
            result.push(row);

            if (col >= 0) {
                let colIdx = col;
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
            // Reset internal state
            reset: function() {
                this.mt = [];
                this.debug = false;
            },

            /**
             * Load table structure, convert to matrix
             */
            load: function(table, escapeCls, debug) {
                if (typeof Array.fill == 'undefined') {
                    Array.prototype.fill = function(value) {
                        let length = this.length;
                        for (let i = 0; i < length; i++) {
                            this[i] = value;
                        }
                        return this;
                    }
                }
                let tableEle = typeof (table) === 'object' ? table : document.querySelector(table);
                let ts = [];
                let escapeClsArr = escapeCls ? escapeCls.split(',') : [];
                tableEle.querySelectorAll('tr').forEach(trEle => {
                    let rowArr = [];
                    trEle.querySelectorAll('th,td').forEach(tdEle => {
                        if (escapeClsArr.length > 0) {
                            for (let i = 0, len = escapeClsArr.length; i < len; i++) {
                                if (tdEle.classList.contains(escapeClsArr[i])) {
                                    return;
                                }
                            }
                        }
                        let cellArr = [];
                        cellArr.push(~~tdEle.getAttribute('rowspan') || 1);
                        cellArr.push(~~tdEle.getAttribute('colspan') || 1);
                        rowArr.push(cellArr);
                    });
                    ts.push(rowArr);
                });

                let mt = [];
                let rowCnt = ts.length;
                let colCnt = 0;

                //Get column counter in first row
                for (let i = 0, len = ts.length > 0 ? ts[0].length : 0; i < len; i++) {
                    colCnt += ts[0][i][1];
                }

                //Fill matrix with same value for each cell in row
                for (let i = 0; i < rowCnt; i++) {
                    let rowArr = new Array(colCnt).fill(i + 1);
                    mt.push(rowArr);
                }
                //Figure out HTML table structure with 2D matrix
                for (let i = 0; i < rowCnt; i++) {
                    let rowArr = ts[i];
                    let tIndex = 0;
                    let len = rowArr.length;
                    for (let j = 0; j < len; j++) {
                        let colArr = rowArr[j];
                        //Skip merged cell
                        while (mt[i][tIndex] < 0) {
                            tIndex++;
                        }
                        let rowSpan = colArr[0];
                        let colSpan = colArr[1];
                        //-2 indicate for colspan
                        for (let k = 1; k < colSpan; k++) {
                            mt[i][tIndex + k] = -2;
                        }
                        for (let k = 1; k < rowSpan; k++) {
                            //-1 indicate for rowspan
                            mt[i + k][tIndex] = -1;
                            for (let l = 1; l < colSpan; l++) {
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
                let arr = [];
                let acol = r2aPosition(row, col, this.mt);
                let rowSpan = 1;
                let colSpan = 1;
                let mt = this.mt;

                while (acol + colSpan < mt[row].length && mt[row][acol + colSpan] == -2) {
                    colSpan++;
                }
                while (row + rowSpan < mt.length && mt[row + rowSpan][acol] == -1) {
                    rowSpan++;
                }
                for (let i = 0; i < rowSpan; i++) {
                    for (let j = 0; j < colSpan; j++) {
                        if (j == 0 && direction == 'left') {
                            let ret = detectMergeCell(row + i, acol, 'left', mt);
                            add(arr, ret);
                        }
                        if (j == colSpan - 1 && direction == 'right') {
                            let ret = detectMergeCell(row + i, acol + j, 'right', mt);
                            add(arr, ret);
                        }
                        if (i == 0 && direction == 'up') {
                            let ret = detectMergeCell(row, acol + j, 'up', mt);
                            add(arr, ret);
                        }
                        if (i == rowSpan - 1 && direction == 'down') {
                            let ret = detectMergeCell(row + i, acol + j, 'down', mt);
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
                let arr = [];
                if (lst) {
                    for (let i = 0, len = lst.length; i < len; i++) {
                        let c = lst[i];
                        let ret = this.getRelCell(c[0], c[1], direction);
                        if (ret.length > 0) {
                            for (let j = 0, retLen = ret.length; j < retLen; j++) {
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
                let ts = [];
                let mt = this.mt;
                rowCnt = mt.length;

                for (let i = 0; i < rowCnt; i++) {
                    let t = [];
                    colCnt = mt[i].length;

                    for (let j = 0; j < colCnt;) {
                        if (mt[i][j] >= 0) {
                            let colSpan = 1;
                            let rowSpan = 1;

                            while (j + colSpan < colCnt && mt[i][j + colSpan] == -2) {
                                colSpan++;
                            }
                            while (i + rowSpan < rowCnt && mt[i + rowSpan][j] == -1) {
                                rowSpan++;
                            }

                            let c = [];
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
                    for (let i = 0; i < mt.length; i++) {
                        let arr = [];
                        for (let j = 0; j < mt[i].length; j++) {
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
                let acol = r2aPosition(row, col, this.mt);
                let mt = this.mt;
                let length = mt.length;
                let result = [];

                if (last == true) {
                    while (acol + 1 < mt[row].length && mt[row][acol + 1] == -2) {
                        acol++;
                    }
                }
                for (let i = 0; i < length; i++) {
                    if (mt[i][acol] < 0) {
                        let rowIdx = i;
                        let colIdx = acol;
                        while (colIdx >= 0 && mt[rowIdx][colIdx] == -2) {
                            colIdx--;
                        }
                        while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                            rowIdx--;
                        }
                        let changed = [];
                        changed.push(rowIdx);
                        changed.push(colIdx >= 0 ? a2rPosition(rowIdx, colIdx, this.mt) : colIdx);
                        add(result, changed);
                    } else {
                        let changed = [];
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
                let mt = this.mt;
                let length = mt.length;
                let result = [];

                if (row >= 0 && row < mt.length) {
                    for (let j = 0; j < mt[row].length; j++) {
                        if (mt[row][j] < 0) {
                            let rowIdx = row;
                            let colIdx = j;
                            while (colIdx >= 0 && mt[rowIdx][colIdx] == -2) {
                                colIdx--;
                            }
                            while (rowIdx >= 0 && mt[rowIdx][colIdx] == -1) {
                                rowIdx--;
                            }
                            let changed = [];
                            changed.push(rowIdx);
                            changed.push(colIdx >= 0 ? a2rPosition(rowIdx, colIdx, this.mt) : colIdx);
                            add(result, changed);
                        } else {
                            let changed = [];
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
                let acol = r2aPosition(row, col, this.mt);
                let result = [];
                if (acol >= 0 && row < this.mt.length - 1) {
                    result = prevCell(row + 1, acol, this.mt);
                }
                return result;
            },

            /**
             * Get insertable cell on row
             */
            insertableCell: function(row, col) {
                let acol = r2aPosition(row, col, this.mt);
                return prevCell(row, acol, this.mt);
            },

            /**
             * Get previous cell (also support cell with rowspan)
             */
            beforeCell: function(row, col, pRowSpan) {
                let acol = r2aPosition(row, col, this.mt);
                let mt = this.mt;
                let result = [];
                for (let i = 0; i < pRowSpan; i++) {
                    let colIdx = acol - 1;
                    let rowIdx = row + i;
                    while (colIdx >= 0 && mt[rowIdx][colIdx] < 0) {
                        colIdx--;
                    }
                    let c = [];
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
                let result = 0;
                if (row >= 0 && row < this.mt.length) {
                    result = this.mt[row].length;
                }
                return result;
            },

            /**
             * Check cell is exists
             */
            hasCell: function(row, col) {
                let acol = r2aPosition(row, col, this.mt);
                let result = false;
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
                let acol = r2aPosition(row, col, this.mt);
                let mt = this.mt;
                let result = {};
                let errorCode = 0;
                let mergeCells = [];
                let splitCells = [];

                //Detect size of current cell
                let cellRowSize = 1;
                let cellColSize = 1;
                for (let j = acol + 1; j < mt[row].length && mt[row][j] == -2; j++) {
                    cellColSize++;
                }
                for (let i = row + 1; i < mt.length && mt[i][acol] == -1; i++) {
                    cellRowSize++;
                }

                //Merge cell
                if (nRow > cellRowSize || nCol > cellColSize) {
                    //Top left
                    let topLeft = {
                        row: row,
                        col: acol
                    };

                    //Top right
                    let cnt = 1;
                    let topRight;
                    if (nCol > cellColSize) {
                        for (let j = acol + 1; j < mt[row].length; j++) {
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
                    let bottomLeft;
                    if (nRow > cellRowSize) {
                        for (let i = row + 1; i < mt.length; i++) {
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


                    let maxCellBound = {
                        row: row + cellRowSize - 1,
                        col: acol + cellColSize - 1
                    };

                    //Check from bottom-left (row)
                    if (bottomLeft.row + 1 < mt.length) {
                        let nextRow = bottomLeft.row + 1;
                        for (let i = bottomLeft.col; i <= topRight.col; i++) {
                            //Check but excluding cells existed in current cell range
                            if ((nextRow > maxCellBound.row || i > maxCellBound.col) && mt[nextRow][i] == -1) {
                                errorCode = -1;
                                break;
                            }
                        }
                    }
                    //Check from top-right (column)
                    let nextCol = topRight.col + 1;
                    for (let i = topRight.row; i <= bottomLeft.row; i++) {
                        //Check but excluding cells existed in current cell range
                        if ((i > maxCellBound.row || nextCol > maxCellBound.col) && nextCol < mt[i].length && mt[i][nextCol] == -2) {
                            errorCode = -2;
                            break;
                        }
                    }

                    let bottomRight = {
                        row: bottomLeft.row,
                        col: topRight.col
                    };

                    //Get all cell in extending range
                    for (let i = topLeft.row; i <= bottomLeft.row; i++) {
                        for (let j = topLeft.col; j <= topRight.col; j++) {
                            if (mt[i][j] > 0) {
                                let c = [];
                                c.push(i);
                                c.push(a2rPosition(i, j, this.mt));
                                add(mergeCells, c);
                            }
                        }
                    }
                }
                //Split cell
                if (nRow < cellRowSize || nCol < cellColSize) {
                    for (let cntR = 0; cntR < cellRowSize; cntR++) {
                        let cnt = 0;
                        let startCell;

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
    }());

    window.Table2Matrix = my;
}());
