import { describe, expect, test } from 'vitest';
import { findJsonObject, parseFunctionArgs } from '../src/utils.ts'

describe('findJsonObject', () => {
  test('Returns null when input does not contain a JSON object', () => {
    const input = 'This is a regular string';
    const result = findJsonObject(input);
    expect(result).toBeNull();
  });

  test('Returns the parsed JSON object when input contains a JSON object', () => {
    const input = 'This is some text { "name": "John", "age": 30 } and more text';
    const result = findJsonObject(input);
    const expected = { name: "John", age: 30 };
    expect(result).toStrictEqual(expected);
  });
});

describe('parseFunctionArgs', () => {
  test('Correctly parses arguments of type number', () => {
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

  test('Correctly parses arguments of different types', () => {
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