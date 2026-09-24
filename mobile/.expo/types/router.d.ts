/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(owner)` | `/(owner)/` | `/(owner)/analytics` | `/(owner)/menu` | `/(owner)/store` | `/(student)` | `/(student)/` | `/(student)/change-password` | `/(student)/edit-profile` | `/(student)/orders` | `/(student)/plate` | `/(student)/profile` | `/(student)/search` | `/_sitemap` | `/analytics` | `/cart` | `/change-password` | `/edit-profile` | `/login` | `/menu` | `/orders` | `/plate` | `/profile` | `/review` | `/search` | `/store`;
      DynamicRoutes: `/order/${Router.SingleRoutePart<T>}` | `/restaurant/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/order/[id]` | `/restaurant/[id]`;
    }
  }
}
