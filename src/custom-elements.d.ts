import * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'genre-switcher': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'character-cards': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'my-spark-shelf': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'ambient-background': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
