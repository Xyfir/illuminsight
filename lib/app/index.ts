import { Illuminsight } from 'types';
import { setConfig } from 'react-hot-loader';
import localForage from 'localforage';
import { render } from 'react-dom';
import * as React from 'react';
import { hot } from 'react-hot-loader/root';
import { App } from 'components/app/App';
import wtf from 'wtf_wikipedia';
import 'typeface-roboto';

// Expose globals for debugging/testing purposes
// @ts-ignore
window.localForage = localForage;
// @ts-ignore
window.wtf = wtf;

declare global {
  namespace NodeJS {
    interface Process {
      enve: Illuminsight.Env;
    }
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker
      .register('/sw.js')
      .then(r => console.log('SW', r))
      .catch(e => console.error('SW', e))
  );
}

/** @todo remove -- https://github.com/gaearon/react-hot-loader/issues/1262 */
setConfig({ reloadHooks: false });

localForage.config({ driver: localForage.INDEXEDDB, name: 'illuminsight' });

render(React.createElement(hot(App)), document.getElementById('content'));
