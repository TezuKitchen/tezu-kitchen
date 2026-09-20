/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(owner)` | `/(owner)/` | `/(owner)/analytics` | `/(owner)/menu` | `/(owner)/store` | `/(student)` | `/(student)/` | `/(student)/edit-profile` | `/(student)/orders` | `/(student)/profile` | `/(student)/search` | `/_sitemap` | `/analytics` | `/cart` | `/edit-profile` | `/login` | `/menu` | `/orders` | `/profile` | `/review` | `/search` | `/store`;
      DynamicRoutes: `/restaurant/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/restaurant/[id]`;
    }
  }
}
