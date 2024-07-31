import { describe, expect, test } from 'vitest';
import { searchFunctionTags, parseFunctionArgs } from '../src/utils.ts'

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

describe('Parse function arguments', () => {
  test('Correctly parses arguments', () => {
    const argValues = {
      a: "191",
      b: "102",
    };
    const argTypes = {
      a: "number",
      b: "number",
    }
    const expected = {
      a: 191,
      b: 102,
    }
    const parsedArgs = parseFunctionArgs(argValues, argTypes);
    expect(parsedArgs).toStrictEqual(expected);
  });

  test('Correctly parses different argument types', () => {
    const argValues = {
      x: "true",
      y: "hello",
      z: "3.14",
    };
    const argTypes = {
      x: "boolean",
      y: "string",
      z: "number",
    }
    const expected = {
      x: true,
      y: "hello",
      z: 3.14,
    }
    const parsedArgs = parseFunctionArgs(argValues, argTypes);
    expect(parsedArgs).toStrictEqual(expected);
  });
});
