import { account, env, region } from '../locations';

let OLD_ENV: NodeJS.ProcessEnv;

beforeAll(() => {
  OLD_ENV = { ...process.env };
});

afterEach(() => {
  process.env = OLD_ENV;
});

describe('Locations', () => {
  it('region returns AWS_REGION', () => {
    process.env.AWS_REGION = 'this_region';
    expect(region()).toBe('this_region');
  });

  it('region defaults to eu-west-2', () => {
    process.env.AWS_REGION = undefined;
    expect(region()).toBe('eu-west-2');
  });

  it('env returns ENVIRONMENT', () => {
    process.env.ENVIRONMENT = 'your_env';
    expect(env()).toBe('your_env');
  });

  it('env defaults to unknown', () => {
    process.env.ENVIRONMENT = undefined;
    expect(env()).toBe('unknown');
  });

  it('account returns AWS_ACCOUNT_ID', () => {
    process.env.AWS_ACCOUNT_ID = '112233445566';
    expect(account()).toBe('112233445566');
  });

  it('account defaults to unknown', () => {
    process.env.AWS_ACCOUNT_ID = undefined;
    expect(account()).toBe('unknown');
  });
});
