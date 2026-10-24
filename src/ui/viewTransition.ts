import { flushSync } from 'react-dom';

/**
 * Cross-fade between the dashboard and the editor where the browser supports
 * view transitions, and change state plainly where it does not.
 *
 * The update is flushed synchronously inside the callback: the API snapshots
 * the document before and after that call, so a change React would otherwise
 * schedule for a later frame would be captured as no change at all.
 */
export const startViewTransition = (update: () => void): void => {
  // Typed as present by lib.dom, but absent in browsers that have not shipped
  // it, so the guard is a runtime check rather than a type narrowing.
  if (typeof document.startViewTransition !== 'function') {
    update();
    return;
  }
  document.startViewTransition(() => {
    flushSync(update);
  });
};
