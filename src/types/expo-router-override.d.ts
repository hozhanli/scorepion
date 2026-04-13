/* eslint-disable */
// Stable override that persists across `expo start` regenerations of
// .expo/types/router.d.ts. Loosens the typedRoutes Href union to accept any
// string pathname so the existing router.push('/auth') style calls typecheck.
import * as Router from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams:
        | string
        | { pathname: string; params?: Router.UnknownInputParams };
      hrefOutputParams:
        | string
        | { pathname: string; params?: Router.UnknownOutputParams };
      href:
        | string
        | { pathname: string; params?: Router.UnknownInputParams };
    }
  }
}
