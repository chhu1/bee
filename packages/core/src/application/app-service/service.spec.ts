import { Container } from 'inversify';

import {
  buildProviderModule,
  AppConfig,
  AppLifeCycles,
  AppMountedResult,
  IApp,
  IAppService,
  IAppSwitcherContext,
  IStatus,
  MatchedRoute,
} from '../../';

async function delay(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

let Status: IStatus = undefined as unknown as IStatus;

function getAppInstance(config: AppConfig): IApp {
  const container = new Container({ defaultScope: 'Singleton' });
  container.load(buildProviderModule(container));
  Status = container.get(IStatus);
  const appService = container.get<IAppService>(IAppService);
  return appService.registerApp(config);
}

function getAppWithLoadHook(
  config: AppConfig,
  hooks: AppLifeCycles = {},
  result: AppMountedResult = {} as AppMountedResult,
): IApp {
  return getAppInstance({
    loadApp: async () => {
      return Promise.resolve({
        mount: async () => {
          await delay(10);
          return result;
        },
        unmount: async () => {
          await delay(10);
          return;
        },
        ...hooks,
      });
    },
    ...config,
  });
}

/**
 * unit
 * @author huchao
 */
describe('App', () => {
  describe('App.load', () => {
    test('应用 load 之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          await delay(10);
          return Promise.resolve({});
        },
      });

      expect(app.status).toBe(Status.NotLoaded);
      app.load({} as IAppSwitcherContext);
      expect(app.status).toBe(Status.LoadingSourceCode);
      await (app as IApp & { _loadDefer: Promise<void> })._loadDefer;
      expect(app.status).toBe(Status.NotMounted);
    });

    test('实例化应用时没有 loadApp 参数，加载应用时会报错', () => {
      const app = getAppInstance({ name: 'app' });

      expect(app.status).toBe(Status.NotLoaded);
      app.load({} as IAppSwitcherContext);
      void expect(async () => {
        await (app as IApp & { _loadDefer: Promise<void> })._loadDefer;
      }).rejects.toThrowError('Can not find loadApp prop');
      expect(app.status).toBe(Status.Broken);
    });

    test('应用 load 失败，应用的状态变化为 LoadError', async () => {
      const app = getAppInstance({
        name: 'app',
        loadApp: async () => {
          await delay(10);
          throw new Error('load error');
        },
      });

      app.load({} as IAppSwitcherContext);
      try {
        await (app as IApp & { _loadDefer: Promise<void> })._loadDefer;
      } catch (error) {
        expect(app.status).toBe(Status.LoadError);
      }
    });
  });

  describe('App.mount', () => {
    test('应用 mount 之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' });
      app.load({} as IAppSwitcherContext);
      expect(app.status).toBe(Status.LoadingSourceCode);
      await (app as IApp & { _loadDefer: Promise<void> })._loadDefer;
      const promise = app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.Mounting);
      await promise;
      expect(app.status).toBe(Status.Mounted);
    });

    test('没有 mount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' }, { mount: undefined });
      app.load({} as IAppSwitcherContext);
      expect(app.status).toBe(Status.LoadingSourceCode);
      await (app as IApp & { _loadDefer: Promise<void> })._loadDefer;
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.Mounted);
    });

    test('应用 mount 失败，应用的状态变化为 broken', async () => {
      const app = getAppWithLoadHook(
        { name: 'app' },
        {
          mount: async () => {
            await delay(10);
            throw new Error('mount error');
          },
        },
      );
      app.load({} as IAppSwitcherContext);
      try {
        await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      } catch (error) {
        expect(app.status).toBe(Status.Broken);
      }
    });
  });

  describe('App.waitForChildContainer', () => {
    test('应用 mount 之后，可以等待该应用的子容器渲染完成。', async () => {
      const test = jest.fn(() => 1);
      const app = getAppWithLoadHook(
        { name: 'app' },
        {},
        {
          containerController: {
            wait: async () => {
              await delay(10);
              return test();
            },
          },
        },
      );

      app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);
      await app.waitForChildContainer('foo', {} as IAppSwitcherContext);

      expect(test).toHaveBeenCalled();
    });
  });

  describe('App.unmount', () => {
    test('应用 unmount 之前和之后，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' }, {});
      app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);

      expect(app.status).toBe(Status.Mounted);
      const promise = app.unmount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.Unmounting);
      await promise;
      expect(app.status).toBe(Status.NotMounted);
    });

    test('没有 unmount 的 hook，应用的状态变化应该正确', async () => {
      const app = getAppWithLoadHook({ name: 'app' }, { unmount: undefined });
      app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);

      expect(app.status).toBe(Status.Mounted);
      await app.unmount({} as IAppSwitcherContext, {} as MatchedRoute);
      expect(app.status).toBe(Status.NotMounted);
    });

    test('应用 unmount 失败，应用的状态变化为 broken', async () => {
      const app = getAppWithLoadHook(
        { name: 'app' },
        {
          unmount: async () => {
            await delay(10);
            throw new Error('unmount error');
          },
        },
      );
      app.load({} as IAppSwitcherContext);
      await app.mount({} as IAppSwitcherContext, {} as MatchedRoute);

      try {
        await app.unmount({} as IAppSwitcherContext, {} as MatchedRoute);
      } catch (error) {
        expect(app.status).toBe(Status.Broken);
      }
    });
  });
});
