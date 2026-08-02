'use client';

import { useEffect } from 'react';

export function ExtensionErrorSuppressor() {
  useEffect(() => {
    const isExtensionError = (msg: string = '', stack: string = '', file: string = '') => {
      const combined = `${msg} ${stack} ${file}`.toLowerCase();
      return (
        combined.includes('metamask') ||
        combined.includes('ethereum') ||
        combined.includes('chrome-extension') ||
        combined.includes('inpage.js') ||
        combined.includes('nkbihfbeogaeaoehlefnkodbefgpgknn')
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason || '');
      const stack = reason?.stack || '';
      if (isExtensionError(msg, stack)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      const stack = event.error?.stack || '';
      const file = event.filename || '';
      if (isExtensionError(msg, stack, file)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection, true);
    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return null;
}
