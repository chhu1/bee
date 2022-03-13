import { inject } from 'inversify';

import { IAppSwitcher, IAppSwitcherKey } from '../../app-switcher/app-switcher/interface';
import { IApp } from '../../application/app/interface';
import { provide } from '../../provider';
import { bindRouter } from '../navigation-events';
import { IRouteKey, RouteOptions } from '../route/interface';
import { IRouter } from '../router/interface';
import { IRouterController, IRouterControllerKey } from './interface';

@provide(IRouterControllerKey)
export class RouterController implements IRouterController {
  public readonly _router: IRouter;

  protected readonly _appSwitcher: IAppSwitcher;

  /** 标识是否已经给 navigationEvent 传入 router 的实例 */
  protected _hasBindRouter = false;

  constructor(@inject(IAppSwitcherKey) appSwitcher: IAppSwitcher, @inject(IRouteKey) router: IRouter) {
    this._appSwitcher = appSwitcher;
    this._router = router;
  }

  public addRoutes(routes: RouteOptions[], app: IApp): void {
    // 将 router 传给 navigationEvent
    if (!this._hasBindRouter) {
      this._hasBindRouter = true;
      bindRouter(this);
    }
    this._router.addRoutes(routes, app);
  }

  public reroute(navigationEvent?: Event | undefined): void {
    this._router.reroute(this._appSwitcher, navigationEvent);
  }

  public start(): void {
    this._router.start(this._appSwitcher);
  }
}
