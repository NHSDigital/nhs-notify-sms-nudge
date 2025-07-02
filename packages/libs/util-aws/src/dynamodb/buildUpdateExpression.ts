type Action = 'SET' | 'REMOVE' | 'ADD' | 'DELETE';

type Input = Partial<Record<Action, string[]>>;

export const buildUpdateExpression = (obj: Input): string =>
  Object.entries(obj)
    .flatMap(([action, clauses]) =>
      clauses.length ? [`${action} ${clauses.join(', ')}`] : []
    )
    .join(' ');
