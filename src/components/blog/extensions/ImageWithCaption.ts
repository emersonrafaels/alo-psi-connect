import { Node, mergeAttributes } from '@tiptap/core';

export interface ImageWithCaptionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImageWithCaption: (options: { src: string; alt?: string; caption?: string }) => ReturnType;
    };
  }
}

export const ImageWithCaption = Node.create<ImageWithCaptionOptions>({
  name: 'imageWithCaption',
  
  group: 'block',
  
  draggable: true,
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('src'),
      },
      alt: {
        default: null,
        parseHTML: element => element.querySelector('img')?.getAttribute('alt'),
      },
      caption: {
        default: null,
        parseHTML: element => element.querySelector('figcaption')?.textContent,
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-with-caption"]',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'image-with-caption',
        'class': 'image-with-caption',
      }),
      [
        'img',
        {
          src: HTMLAttributes.src,
          alt: HTMLAttributes.alt || '',
          class: 'rounded-lg shadow-lg',
        },
      ],
      HTMLAttributes.caption
        ? [
            'figcaption',
            {
              class: 'text-center text-sm text-muted-foreground mt-2 italic',
            },
            HTMLAttributes.caption,
          ]
        : undefined,
    ].filter(Boolean) as any;
  },
  
  addCommands() {
    return {
      setImageWithCaption:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});
