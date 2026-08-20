declare module 'jest-axe' {
  export function axe(container?: Element | Document): Promise<any>;
  export function toHaveNoViolations(): any;
  export function configureAxe(config?: any): any;
}

declare namespace jest {
  interface Matchers<R> {
    toHaveNoViolations(): R;
  }
}