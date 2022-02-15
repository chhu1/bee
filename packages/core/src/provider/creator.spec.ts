import { Container } from 'inversify';

import { createProvider } from './creator';

afterEach(() => {
  Reflect.defineMetadata('metaKey', [], Reflect);
  Reflect.defineMetadata('otherMetaKey', [], Reflect);
});

/**
 * unit
 * @author huchao
 */
describe('createProvider', () => {
  test('新建一个类，使用 provide 装饰，应当自动绑定成功。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {}

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());
    expect(container.get('test')).toBeInstanceOf(Test);
  });

  test('新建一个类，使用 provide 装饰，然后继承该类，也使用 provide 装饰并使用相同的 key，应当自动绑定继承的类。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');

    @provide('test')
    class Test {}

    @provide('test')
    class OtherTest extends Test {}

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());

    expect(container.get('test')).toBeInstanceOf(OtherTest);
  });

  test('新建一个类，使用 provide 装饰，然后不继承该类，也使用 provide 装饰并使用相同的 key，应当报错。', () => {
    const { provide } = createProvider('metaKey');

    @provide('test')
    class Test {}

    expect(() => {
      @provide('test')
      class OtherTest {}

      console.log(Test, OtherTest);
    }).toThrowError('Provide Error: replace serviceIdentifier');
  });

  test('新建一个类，使用 provide 装饰，然后继承该类，也使用 provide 装饰并使用相同的 key 和不同的绑定类型，应当报错。', () => {
    const { provide } = createProvider('metaKey');

    @provide('test')
    class Test {}

    expect(() => {
      @provide('test', 'Constructor')
      class OtherTest extends Test {}

      console.log(Test, OtherTest);
    }).toThrowError('Provide Error: replace serviceIdentifier');
  });

  test('创建两个不同的 provide，绑定相同的 provide key，应该互不干扰。', () => {
    const { provide, buildProviderModule } = createProvider('metaKey');
    const { provide: otherProvide, buildProviderModule: otherBuildProviderModule } = createProvider('otherMetaKey');

    @provide('test')
    class Test {}

    @otherProvide('test')
    class OtherTest {}

    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());
    const otherContainer = new Container({ defaultScope: 'Singleton' });
    otherContainer.load(otherBuildProviderModule());

    expect(container.get('test')).toBeInstanceOf(Test);
    expect(otherContainer.get('test')).toBeInstanceOf(OtherTest);
  });

  test('创建一个常量，调用 provideValue，应当自动绑定成功。', () => {
    const { provideValue, buildProviderModule } = createProvider('metaKey');

    provideValue('foo', 'test');
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());

    expect(container.get('test')).toBe('foo');
  });

  test('两次调用 provideValue 绑定同一个 key，应当绑定新值。', () => {
    const { provideValue, buildProviderModule } = createProvider('metaKey');

    provideValue('foo', 'test');
    provideValue('bar', 'test');
    const container = new Container({ defaultScope: 'Singleton' });
    container.load(buildProviderModule());

    expect(container.get('test')).toBe('bar');
  });
});
