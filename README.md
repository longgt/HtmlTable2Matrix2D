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

## Demo

https://plnkr.co/edit/wmxo1xoufRLlOVSnknM8?p=preview
