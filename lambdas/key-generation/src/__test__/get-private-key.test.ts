import { readFile } from 'node:fs/promises';
import { format } from 'date-fns';
import { logger } from 'nhs-notify-sms-nudge-utils';
import { getPrivateKey } from 'get-private-key';
import { loadConfig } from 'config';
import { parameterStore } from 'infra';

jest.mock('nhs-notify-sms-nudge-utils', () => {
  const originalModule = jest.requireActual('nhs-notify-sms-nudge-utils');

  return {
    ...originalModule,
    ParameterStore: jest.fn(() => ({
      getAllParameters: jest.fn(),
    })),
  };
});

jest.mock('node:fs/promises');
jest.mock('../config');

const testKeyId1 = 'kCwsCGf_v7ffSQ8o5pK416vh024ZVnTiPOxAxzbi0lU';
const testKeyId2 = 'wXQjso8bavigbplIxaB3rYbeGT_lgWAIGZ-25heprHo';
const testKeyId3 = 'eU44V5UrGllANaLk3tmDz_Q7lybo0N8nM7D127Pr35k';

const testPrivateKey1 = `-----BEGIN EC PRIVATE KEY-----
MHcCAQEEIEpVnqrylY4xEsQdQgJhGFUFKGTGtl5cnKsIq2uNWa56oAoGCCqGSM49
AwEHoUQDQgAEqoc8zybajz/NEoUzP5G7lchuuD7dej7vKlWConh1mvI9gvmyRheT
0vrkuPszvyLXTYusKKgiLZkqz3SHOjVhDw==
-----END EC PRIVATE KEY-----
`;

const testPrivateKey2 = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQDOji5Hvtf2H3HjqF5OM78lqnbFPEzbaMYRCftKPTHzospfKI0C
IMd01cIUBgXwwbiHPj3yuLrnPp392ulDaWsFlpgDS67PcHG7c5oMfQ7BEIoheAk9
7uMyY3jawVDOpeZEvV71lIWou0Dg3PeufH9u1kcuOwMR+kwidNm8RWYfHwIDAQAB
AoGABwdDf+F4i8FqKKrz+ok8OdXhELkKjHS2OKI0UMRgTL//TtmcYrQm1Uzou7Gw
xg5xbvipNvceNPwmeBrY0RhnMcvU522mDJiomuCbrTzTf0Y1IiGrDBuBYnRdVt1c
4Q/aBQV7Z8lm4R0nsdUyae7I2k7qP0A54asmPT7qcmAhAeECQQDq5ririE2XrJFY
1T2OrqcAufi4go0LAlsQU3cH14In9hssSgGcQizjG98azHPGUbtCKBvQjeYyyxPs
yUEqfi2XAkEA4Rut+jZSPTIL419YLA1vgWqjfX8j2sCzxCGTK5zWZT9F3UJEdydp
7o1cHfqnoeJEtc7semZCZBl2orucj2HbuQJAI98H5Gn0L21S5NXriJZzOlEsAkEt
eLjrXxrf2nq2jZOvopvKkyon4Kao81a1d1uT1Q568OY6eRc5+7bgFLUgEQJAEqsT
+4sjuNV8rOeMTWLz21y3oEG5/Hs8rUhHhzdjhFQB/D5xpRwMqe7pM8dEvaUhI568
d84hNWHzN72tVyq7aQJBALUHy2Dw0WHxmTcC1YYpGAoasu881G59ovaue5gfYToW
+O+F9348DgRUamIqjLQxAPygpm77VGkywsKFoaUb4W0=
-----END RSA PRIVATE KEY-----
`;
const testPrivateKey3 = `-----BEGIN RSA PRIVATE KEY-----
MIICWwIBAAKBgQCqIJHZnWgKNkWOdJjvxD1s5y8LHvBSa98Tzm2tYVXMlDV8He6/
5t/kShyL6YMb+7JZwazRAoZa0OMCKFKBfxn4fiOq4q2dDfHtBMDWz/gz6SINMpKQ
+H8mJOGqJ4sbHuRbmc6X9SgFhFT3cc0DrxiDNXEgFotwDAtvu2GWUOEuHQIDAQAB
AoGACi2yrDNnsxy2IqTFNasnBan7PY4XUMcVbKjwFOx65qeDX66mxyJ4CL+KX7CT
4Iu5ivc0cLjW8v4GZu2kqgzBr+xXdNMSyCjvIqqamXyyfROfqkHweiYwxV1prdk5
6zneaibWXKZoY78zrCoI0tLpd/qGUVv0F2Eq4VBkUyfUFWECQQDX/we7s8ijtM+k
Qnu66qhyfcKVlXh7QpQXoWNu2HCAPTeCrfSBKhkIltUsGQXizkmAQmPp6sFdLJFE
3iJtr9ClAkEAyaLEBgfJVZaFqUYit9I2H26Q4/nClwf56lF+4Gi6sd8Xu/MqSncX
Rk78v/22Y3szHStY+1633zut3qx76Hc2GQJAOvzxNbfRsbOtiWSGufNf8XSa8ZMS
hkcWfqWarCj8AGm3gT7UqXm/wHLA4PwseVZxCFAZTUbJbBLB0ZcAvAfp6QJAcMgS
3tCiI7ZSwtDRAIKa9U/RyUJdPj8e4Zp93iWWL4F6dA1aHVapdREfPIA78T7q4yjo
14kuTbXC1eciU2/CmQJATfjLKRCl6xSOzDBiko5syG6EBXSealZAYluXlxIkpqlF
6dEWd1fYFs35C6o5+bT8N5Eg7tn0ftZ3bfwZcK5Blg==
-----END RSA PRIVATE KEY-----
`;

describe('getPrivateKey', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.NO_CACHE = 'true';
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
    jest.spyOn(logger, 'error').mockImplementation(() => logger);
  });

  it('gets private key from ssm', async () => {
    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      pemSSMPath: 'ssm-path',
    });
    (parameterStore.getAllParameters as jest.Mock).mockReturnValue([
      {
        Name: `privatekey_20201105_${testKeyId1}.pem`,
        Value: testPrivateKey1,
      },
    ]);

    const testOutput = await getPrivateKey();

    const expectedOutput = {
      kid: testKeyId1,
      key: testPrivateKey1,
    };

    expect(testOutput).toMatchObject(expectedOutput);
  });

  it('selects second youngest key when youngest key has been generated today', async () => {
    const todaysDateUnformatted = new Date();
    const todaysDate = format(todaysDateUnformatted, 'yyyyMMdd');

    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      pemSSMPath: 'ssm-path',
    });
    (parameterStore.getAllParameters as jest.Mock).mockReturnValue([
      {
        Name: `privatekey_${todaysDate}_${testKeyId1}.pem`,
        Value: testPrivateKey1,
      },
      {
        Name: `privatekey_20201203_${testKeyId2}.pem`,
        Value: testPrivateKey2,
      },
      {
        Name: `privatekey_20211103_${testKeyId3}.pem`,
        Value: testPrivateKey3,
      },
    ]);

    const testOutput = await getPrivateKey();

    const expectedOutput = {
      kid: testKeyId3,
      key: testPrivateKey3,
    };

    expect(testOutput).toMatchObject(expectedOutput);
  });

  it('selects second youngest key when youngest key has been generated on the previous day', async () => {
    const yesterdaysDateUnformatted = new Date();
    yesterdaysDateUnformatted.setDate(yesterdaysDateUnformatted.getDate() - 1);

    const yesterdaysDate = format(yesterdaysDateUnformatted, 'yyyyMMdd');

    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      pemSSMPath: 'ssm-path',
    });
    (parameterStore.getAllParameters as jest.Mock).mockReturnValue([
      {
        Name: `privatekey_${yesterdaysDate}_${testKeyId1}.pem`,
        Value: testPrivateKey1,
      },
      {
        Name: `privatekey_20201103_${testKeyId2}.pem`,
        Value: testPrivateKey2,
      },
      {
        Name: `privatekey_20211103_${testKeyId3}.pem`,
        Value: testPrivateKey3,
      },
    ]);

    const testOutput = await getPrivateKey();

    const expectedOutput = {
      kid: testKeyId3,
      key: testPrivateKey3,
    };

    expect(testOutput).toMatchObject(expectedOutput);
  });

  it('selects youngest key when more than one key exists and the youngest key wasnt generated today or yesterday', async () => {
    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      pemSSMPath: 'ssm-path',
    });
    (parameterStore.getAllParameters as jest.Mock).mockReturnValue([
      {
        Name: `privatekey_20221103_${testKeyId1}.pem`,
        Value: testPrivateKey1,
      },
      {
        Name: `privatekey_20201103_${testKeyId2}.pem`,
        Value: testPrivateKey2,
      },
      {
        Name: `privatekey_20211103_${testKeyId3}.pem`,
        Value: testPrivateKey3,
      },
    ]);

    const testOutput = await getPrivateKey();

    const expectedOutput = {
      kid: testKeyId1,
      key: testPrivateKey1,
    };

    expect(testOutput).toMatchObject(expectedOutput);
  });

  it('gets private key from local file', async () => {
    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'local',
      pemSSMPath: 'ssm-path',
    });
    (readFile as jest.Mock).mockReturnValue(testPrivateKey1);
    (parameterStore.getAllParameters as jest.Mock).mockImplementation(() => {
      throw new Error('error');
    });

    const testOutput = await getPrivateKey();

    const expectedOutput = {
      kid: testKeyId1,
      key: testPrivateKey1,
    };

    expect(testOutput).toMatchObject(expectedOutput);
  });

  it('throws error if no private keys found', async () => {
    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      pemSSMPath: 'ssm-path',
    });
    (readFile as jest.Mock).mockImplementation(() => {
      throw new Error('error');
    });
    (parameterStore.getAllParameters as jest.Mock).mockReturnValue([]);

    await expect(getPrivateKey()).rejects.toThrow('Failure in getPrivateKey()');
  });

  it('throws error if invalid private key found', async () => {
    (loadConfig as jest.Mock).mockReturnValue({
      environment: 'internal-dev',
      pemSSMPath: 'ssm-path',
    });
    (readFile as jest.Mock).mockImplementation(() => {
      throw new Error('error');
    });
    (parameterStore.getAllParameters as jest.Mock).mockReturnValue([
      {
        Name: `privatekey_20201105_${testKeyId1}.pem`,
        Value: 'bad-key-value',
      },
    ]);

    await expect(getPrivateKey()).rejects.toThrow('Failure in getPrivateKey()');
  });
});
