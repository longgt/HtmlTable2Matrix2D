# HtmlTable2Matrix
Transform HTML table to 2D matrix, using matrix for some tasks such as merge cell, delete row, delete column...

## How to transform HTML table to 2D matrix

1. Each tr tag is connected with one row in matrix
2. Each td tag is connected with one column in row of matrix
3. All td tag in same tr will have same positive value 
4. -1 will be used to indicate rowspan
5. -2 will be used to indicate colspan

## How to calculate HTML td position in matrix

1. rowIndex is index of row containg td
2. colIndex is index of td in tr
3. Index of td in matrix is index of positive value having

`[count of positive value before it + 1] equals to index of td in HTML table`

## How to identify cells connected to one cell (in top, right, left, bottom direction)

1. Calculate td position in matrix
2. Following given direction, do the following task
  * If value is -2, cell is colspan, go to left until getting -1 or positive value
  * If value is -1, cell is rowspan, go to up until getting positive value
  * The position of positive value after done 2.1 and 2.2 task is the result.
  * Transform the position of y column in the result to the index of column in HTML table

`The index of column in HTML table is [the count of positive value before it in matrix + 1]`

## Table processing

### Delete column

Assume y is index of column target of deleting.

1. Transform y to absolute position in matrix (called ay)
2. Traverse matrix from top to bottom, identify cell connected to ay
  * If cell value is positive
    * If value of next cell is positive, cell is not colspan, just delete cell
    * If value is negative, cell is colspan, just shift right value of current cell one column (identify cell in html table and subtract colspan by 1)
  * If cell value is negative, cell is colspan, just delete value in matrix (identify cell in html table and subtract colspan by 1)
  
### Delete row

Assume x is index of row target of deleting

1. Traverse matrix from left to right, identify cell connected to x
  * If cell value is positive
    * If value of cell below is positive, cell is not rowspan, just delete cell
    * If value of cell below is negative, cell is rowspan, just shift down value of current cell one row (create cell in row below having rowspan value subtract by 1)
  * If cell value is negative
    * If value is -2, which idicates colspan, just skip it
    * If value is -1, just delete it (traverse up to find root position, find cell in html and subtract rowspan by 1)

## Demo

https://run.plnkr.co/preview/ck191i95n0006396br9p8dq00/
