import { getPkgReleases } from '..';
import { Fixtures } from '../../../../test/fixtures';
import * as httpMock from '../../../../test/http-mock';
import { EXTERNAL_HOST_ERROR } from '../../../constants/error-messages';
import { datasource, defaultRegistryUrl } from './common';

const packageName = 'nodejs';

function getPath(packageName: string): string {
  return `/pkg?name=${packageName}`;
}

describe('modules/datasource/devbox/index', () => {
  describe('getReleases', () => {
    it('throws for error', async () => {
      httpMock
        .scope(defaultRegistryUrl)
        .get(getPath(packageName))
        .replyWithError('error');
      await expect(
        getPkgReleases({
          datasource,
          packageName,
        }),
      ).rejects.toThrow(EXTERNAL_HOST_ERROR);
    });
  });

  it('returns null for 404', async () => {
    httpMock.scope(defaultRegistryUrl).get(getPath(packageName)).reply(404);
    expect(
      await getPkgReleases({
        datasource,
        packageName,
      }),
    ).toBeNull();
  });

  it('returns null for empty result', async () => {
    httpMock.scope(defaultRegistryUrl).get(getPath(packageName)).reply(200, {});
    expect(
      await getPkgReleases({
        datasource,
        packageName,
      }),
    ).toBeNull();
  });

  it('returns null for empty 200 OK', async () => {
    httpMock
      .scope(defaultRegistryUrl)
      .get(getPath(packageName))
      .reply(200, { versions: [] });
    expect(
      await getPkgReleases({
        datasource,
        packageName,
      }),
    ).toBeNull();
  });

  it('throws for 5xx', async () => {
    httpMock.scope(defaultRegistryUrl).get(getPath(packageName)).reply(502);
    await expect(
      getPkgReleases({
        datasource,
        packageName,
      }),
    ).rejects.toThrow(EXTERNAL_HOST_ERROR);
  });

  it('processes real data', async () => {
    httpMock
      .scope(defaultRegistryUrl)
      .get(getPath(packageName))
      .reply(200, Fixtures.get('releases.json'));
    const res = await getPkgReleases({
      datasource,
      packageName,
    });
    expect(res?.homepage).toBe('https://nodejs.org');
    expect(res?.releases[0]).toStrictEqual({
      version: '20.10.0',
      releaseTimestamp: '2024-01-14T03:55:27.000Z',
    });
    expect(res?.releases).toHaveLength(19);
  });

  it('processes empty data', async () => {
    httpMock
      .scope(defaultRegistryUrl)
      .get(getPath(packageName))
      .reply(200, Fixtures.get('releases-empty.json'));
    const res = await getPkgReleases({
      datasource,
      packageName,
    });
    expect(res).toBeNull();
  });
});
