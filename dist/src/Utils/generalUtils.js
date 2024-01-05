import { warn } from "loglevel";
import { dropHeaderOrAlias, regNFlags, splitLinksRegex } from "../constants";
export function sum(arr) {
    return arr.reduce((a, b) => a + b);
}
export function normalise(arr) {
    const max = Math.max(...arr);
    return arr.map((item) => item / max);
}
export const isSubset = (arr1, arr2) => arr1.every((value) => arr2.includes(value));
export function splitAndDrop(str) {
    var _a, _b;
    return ((_b = (_a = str === null || str === void 0 ? void 0 : str.match(splitLinksRegex)) === null || _a === void 0 ? void 0 : _a.map((link) => { var _a; return (_a = link.match(dropHeaderOrAlias)) === null || _a === void 0 ? void 0 : _a[1]; })) !== null && _b !== void 0 ? _b : []);
}
export const dropPath = (path) => path.replace(/^.*\//, "");
export const dropDendron = (path, settings) => settings.trimDendronNotes
    ? path.split(settings.dendronNoteDelimiter).last()
    : path;
export const dropPathNDendron = (path, settings) => dropDendron(dropPath(path), settings);
export const dropFolder = (path) => path.split("/").last().split(".").slice(0, -1).join(".");
export const splitAndTrim = (fields) => {
    if (!fields || fields === "")
        return [];
    else
        return fields.split(",").map((str) => str.trim());
};
/**
 * Pad an array with a filler value to a specified length.
 * @param {T[]} arr - The array to pad.
 * @param {number} finalLength - The final length of the array
 * @param {string} [filler=""] - The filler to use if the array is too short.
 * @returns {(T | string)[]} The array with the new values.
 */
export function padArray(arr, finalLength, filler = "") {
    const copy = [...arr];
    const currLength = copy.length;
    if (currLength > finalLength)
        throw new Error("Current length is greater than final length");
    else if (currLength === finalLength)
        return copy;
    else {
        for (let i = currLength; i < finalLength; i++)
            copy.push(filler);
        return copy;
    }
}
/**
 * transpose(A) returns the transpose of A.
 * @param {T[][]} A - The matrix to transpose.
 * @returns {T[][]} A 2D array of the transposed matrix.
 */
export function transpose(A) {
    const cols = A[0].length;
    const AT = [];
    for (let j = 0; j < cols; j++)
        AT.push(A.map((row) => row[j]));
    return AT;
}
/**
 * Given an array of strings, return an array of objects that represent the runs of consecutive strings
 * in the array.
 * @param {string} arr
 * @returns An array of objects with the following properties:
 *
 *   `value`: the value of the run
 *
 *   `first`: the index of the first element in the run
 *
 *   `last`: the index of the last element in the run
 */
export function runs(arr) {
    const runs = [];
    let i = 0;
    while (i < arr.length) {
        const currValue = arr[i];
        runs.push({ value: currValue, first: i, last: undefined });
        while (currValue === arr[i]) {
            i++;
        }
        runs.last().last = i - 1;
    }
    return runs;
}
// SOURCE https://stackoverflow.com/questions/9960908/permutations-in-javascript
/**
 * Given a permutation, return all possible permutations of that permutation.
 * @param permutation - the array to be permuted
 * @returns `[ [ 1, 2, 3 ], [ 1, 3, 2 ], [ 2, 1, 3 ], [ 2, 3, 1 ], [ 3, 1, 2 ], [ 3, 2, 1 ] ]`
 */
export function permute(permutation) {
    const length = permutation.length, result = [permutation.slice()], c = new Array(length).fill(0);
    let i = 1, k, p;
    while (i < length) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = permutation[i];
            permutation[i] = permutation[k];
            permutation[k] = p;
            ++c[i];
            i = 1;
            result.push(permutation.slice());
        }
        else {
            c[i] = 0;
            ++i;
        }
    }
    return result;
}
export const range = (n) => [...Array(n).keys()];
/**
 * "Given two arrays, return the elements in the first array that are not in the second array."
 * @param {T[]} A - the array of items to be filtered
 * @param {T[]} B - the array of items that are not in A
 * @returns {T[]} None
 */
export const complement = (A, B) => A.filter((a) => !B.includes(a));
export function swapItems(i, j, arr) {
    const max = arr.length - 1;
    if (i < 0 || i > max || j < 0 || j > max)
        return arr;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    return arr;
}
/**
 * Remove duplicates from an array.
 * @param {T[]} arr - The array to be filtered.
 * @returns {T[]} The array with duplicates removed.
 */
export const removeDuplicates = (arr) => [...new Set(arr)];
export function strToRegex(input) {
    const match = input.match(regNFlags);
    if (!match)
        return null;
    const [, innerRegex, flags] = match;
    try {
        const regex = new RegExp(innerRegex, flags);
        return regex;
    }
    catch (e) {
        warn(e);
        return null;
    }
}
// Source: https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
export function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
//# sourceMappingURL=generalUtils.js.map