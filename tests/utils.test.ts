import { describe, expect, test } from 'vitest';
import { searchFunctionTags } from '../src/utils.ts'

describe('Function Tag Tests', () => {
  test('function tags found', () => {
    const s = `<function=add>{"a": 119, "b": 991}</function> 

Note: This function call is based on the 'add' function provided. The parameters are required and must be integers.
`
    const actual = searchFunctionTags(s);
    const expected = {
      add: {
        a: 119,
        b: 991,
      }
    }
    console.log(actual);
    expect(actual).toStrictEqual(expected);
  })

  test('function tags found with different values', () => {
    const s = `<function=multiply>{"x": 5, "y": 7}</function> 

Note: This function call is based on the 'multiply' function provided. The parameters are required and must be integers.
`
    const actual = searchFunctionTags(s);
    const expected = {
      multiply: {
        x: 5,
        y: 7,
      }
    }
    console.log(actual);
    expect(actual).toStrictEqual(expected);
  })
})
