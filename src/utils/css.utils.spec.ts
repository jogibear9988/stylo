import {injectCSS} from './css.utils';

describe('css', () => {
  it('should inject global css in head', () => {
    injectCSS(document);

    let style: HTMLStyleElement | null = document.head.querySelector('style[stylo-editor]');
    expect(style).not.toBeNull();
  });

  it('should not inject twice global css in head', () => {
    injectCSS(document);
    injectCSS(document);

    let styles: NodeListOf<HTMLStyleElement> =
      document.head.querySelectorAll('style[stylo-editor]');
    expect(styles.length).toEqual(1);
  });
});

describe('css shadow', () => {
  it('should inject global css in shadowRoot', () => {
    const div = document.createElement('div');
    const shadowRoot = div.attachShadow({mode: 'open'});
    const divInner = document.createElement('div');
    shadowRoot.appendChild(divInner);

    injectCSS(divInner.getRootNode());

    let style: HTMLStyleElement | null = shadowRoot.querySelector('style[stylo-editor]');
    expect(style).not.toBeNull();
  });

  it('should not inject twice global css in shadowRoot', () => {
    const div = document.createElement('div');
    const shadowRoot = div.attachShadow({mode: 'open'});
    const divInner = document.createElement('div');
    shadowRoot.appendChild(divInner);

    injectCSS(divInner.getRootNode());
    injectCSS(divInner.getRootNode());

    let styles: NodeListOf<HTMLStyleElement> =
      shadowRoot.querySelectorAll('style[stylo-editor]');
    expect(styles.length).toEqual(1);
  });
});
