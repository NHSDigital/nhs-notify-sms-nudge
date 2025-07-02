import { buildUpdateExpression } from '../../dynamodb/buildUpdateExpression';

describe('buildUpdateExpression', () => {
  it('constructs an update expression', () => {
    const actual = buildUpdateExpression({
      SET: ['ProductCategory = :c', 'Price = :p'],
      REMOVE: ['Brand', 'InStock', 'QuantityOnHand'],
      ADD: ['QuantityOnHand :q'],
      DELETE: ['Color :p'],
    });

    const expected =
      'SET ProductCategory = :c, Price = :p REMOVE Brand, InStock, QuantityOnHand ADD QuantityOnHand :q DELETE Color :p';

    expect(actual).toEqual(expected);
  });

  it('ignores actions with empty clause arrays', () => {
    const actual = buildUpdateExpression({
      DELETE: ['Color :p'],
      REMOVE: [],
      SET: ['ProductCategory = :c', 'Price = :p'],
    });

    const expected = 'DELETE Color :p SET ProductCategory = :c, Price = :p';

    expect(actual).toEqual(expected);
  });
});
