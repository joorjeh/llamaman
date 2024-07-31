import { describe, expect, test } from 'vitest';
import { searchFunctionTags, analyzeFunction } from '../src/utils.ts'

describe('Function Tag Tests', () => {
  test('function tags found', () => {
    const s = `<function=add>{"a": 119, "b": 991}</function> 

Note: This function call is based on the 'add' function provided. The parameters are required and must be integers.
`
    const actual = searchFunctionTags(s);
    const expected = {
      name: 'add',
      args: {
        a: 119,
        b: 991,
      }
    }
    expect(actual).toStrictEqual(expected);
  })

  test('function tags found with different values', () => {
    const s = `<function=multiply>{"x": 5, "y": 7}</function> 

Note: This function call is based on the 'multiply' function provided. The parameters are required and must be integers.
`
    const actual = searchFunctionTags(s);
    const expected = {
      name: 'multiply',
      args: {
        x: 5,
        y: 7,
      }
    }
    expect(actual).toStrictEqual(expected);
  })
})

describe('Function type analyzer tests', () => {
  test('Correctly gets type of fucntion arguments', () => {
    const f = (a: number, b: string, c: boolean): string => {
      return a + b + c;
    }
    const result = analyzeFunction(f);
    console.log(result);
    expect(2).toBe(1);
  });
});
