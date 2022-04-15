import { HookContext } from '@versea/tapable';

import { IAppService } from '../../application/app-service/service';
import { IApp } from '../../application/app/service';
import { MatchedResult } from '../../navigation/matcher/service';
import { MatchedRoute } from '../../navigation/route/service';
import { createServiceSymbol } from '../../utils';
import { IAppSwitcherContext } from '../app-switcher-context/service';
import { IRendererStore } from '../renderer-store/service';

export const IRendererHookContextKey = createServiceSymbol('IRendererHookContext');

export interface IRendererHookContext extends HookContext {
  readonly switcherContext: IAppSwitcherContext;

  /**
   * 需要切换的目标路由
   * @description 包含整个路由信息，主路由应用和碎片路由应用。
   */
  targetRoutes: MatchedRoute[];

  /** 需要切换根部碎片路由 */
  targetRootFragmentRoutes: MatchedRoute[];

  /**
   * 当前正在运行的路由
   * @description 包含整个路由信息，主路由应用和碎片路由应用。
   */
  readonly currentRoutes: MatchedRoute[];

  /** 当前正在运行的根部碎片路由 */
  readonly currentRootFragmentRoutes: MatchedRoute[];

  /** 当前正在运行的路由以及渲染的应用 */
  readonly rendererStore: IRendererStore;

  /** 当前普通路由和目标普通路由不匹配的位置 */
  readonly mismatchIndex: number;

  /** 当前普通路由的操作对象 */
  target: NormalRendererTarget | null;

  setTarget: (index: number) => void;

  resetTarget: () => void;

  /** bootstrap 之后再 mount 应用 */
  bootstrapAndMount: (app: IApp, route: MatchedRoute) => Promise<void>;
}

/** 普通路由的操作对象 */
export interface NormalRendererTarget {
  index: number;
  currentRoute: MatchedRoute;
  targetRoute: MatchedRoute;
}

export interface RendererHookContextOptions {
  matchedResult: MatchedResult;
  switcherContext: IAppSwitcherContext;
  rendererStore: IRendererStore;
  appService: IAppService;
}