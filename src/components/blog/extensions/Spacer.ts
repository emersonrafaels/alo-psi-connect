import { Node, mergeAttributes } from '@tiptap/core';

export interface SpacerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      setSpacer: (height?: string) => ReturnType;
    };
  }
}

export const Spacer = Node.create<SpacerOptions>({
  name: 'spacer',
  
  group: 'block',
  
  atom: true,
  
  draggable: true,
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      height: {
        default: '15px',
        parseHTML: element => element.getAttribute('data-height') || '15px',
        renderHTML: attributes => {
          return {
            'data-height': attributes.height,
          };
        },
      },
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'div[data-type="spacer"]',
      },
      {
        tag: 'div.editor-spacer',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const height = HTMLAttributes['data-height'] || HTMLAttributes.height || '60px';
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-type': 'spacer',
        'data-height': height,
        'class': 'spacer-block',
        'style': `height: ${height}; margin: 20px 0;`,
      }),
    ];
  },
  
  addCommands() {
    return {
      setSpacer: (height = '15px') => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: { height },
        });
      },
    };
  },
});
