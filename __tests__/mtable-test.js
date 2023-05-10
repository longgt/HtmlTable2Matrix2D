/**
 * @jest-environment jsdom
 */
'use strict';


beforeAll(() => {
    require("../mtable");
});

beforeEach(() => {
    window.Table2Matrix.mtTable.reset();
});

test('load normal table structure properly', () => {
    document.body.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Column 1</th>
        </tr>
      <thead>
      <tbody>
        <tr>
          <td>Value 1</td>
        </tr>
      </tbody>
    </table>
    `;

    const exptected = [[1], [2]];
    const table = document.querySelector('table');
    window.Table2Matrix.mtTable.load(table);

    expect(window.Table2Matrix.mtTable.getMatrix()).toEqual(expect.arrayContaining(exptected));
});

test('load table containing merged cells/columns structure properly', () => {
    document.body.innerHTML = `
    <table class="tg" id="demoTable">
        <thead>
        <tr>
            <th>1</th>
            <th>1</th>
            <th>1</th>
            <th>1</th>
            <th>1</th>
            <th>1</th>
            <th>1</th>
            <th>1</th>
            <th>1</th>
            <th>1</th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td colspan="2" rowspan="2">2</td>
            <td colspan="3" rowspan="3">2</td>
            <td colspan="4">2</td>
            <td>2</td>
        </tr>
        <tr>
            <td>3</td>
            <td>3</td>
            <td>3</td>
            <td rowspan="3">3</td>
            <td>3</td>
        </tr>
        <tr>
            <td>4</td>
            <td>4</td>
            <td colspan="3" rowspan="2">4</td>
            <td>4</td>
        </tr>
        <tr>
            <td colspan="5">5</td>
            <td>5</td>
        </tr>
        <tr>
            <td colspan="2" rowspan="2">6</td>
            <td colspan="2" rowspan="3">6</td>
            <td colspan="5" rowspan="2">6</td>
            <td>6</td>
        </tr>
        <tr>
            <td>7</td>
        </tr>
        <tr>
            <td>8</td>
            <td>8</td>
            <td>8</td>
            <td colspan="4">8</td>
            <td>8</td>
        </tr>
        </tbody>
    </table>
    `;

    const exptected = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [2, -2, 2, -2, -2, 2, -2, -2, -2, 2],
        [-1, -2, -1, -2, -2, 3, 3, 3, 3, 3],
        [4, 4, -1, -2, -2, 4, -2, -2, -1, 4],
        [5, -2, -2, -2, -2, -1, -2, -2, -1, 5],
        [6, -2, 6, -2, 6, -2, -2, -2, -2, 6],
        [-1, -2, -1, -2, -1, -2, -2, -2, -2, 7],
        [8, 8, -1, -2, 8, 8, -2, -2, -2, 8]
        ];
    const table = document.querySelector('table');
    window.Table2Matrix.mtTable.load(table);

    expect(window.Table2Matrix.mtTable.getMatrix()).toEqual(expect.arrayContaining(exptected));
});
