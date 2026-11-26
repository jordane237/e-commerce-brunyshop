import { InjectionToken } from '@angular/core';

export interface AuthRoutePaths {
  login: string;
  forbidden: string;
  home: string;
}

export const AUTH_LOGIN_PATH = new InjectionToken<string>('AUTH_LOGIN_PATH', {
  providedIn: 'root',
  factory: () => '/connexion',
});

export const AUTH_FORBIDDEN_PATH = new InjectionToken<string>('AUTH_FORBIDDEN_PATH', {
  providedIn: 'root',
  factory: () => '/403',
});

export const AUTH_HOME_PATH = new InjectionToken<string>('AUTH_HOME_PATH', {
  providedIn: 'root',
  factory: () => '/compte',
});
