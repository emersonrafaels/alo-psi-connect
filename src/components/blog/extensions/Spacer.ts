import { Node, mergeAttributes } from '@tiptap/core';

export interface SpacerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      setSpacer: () => ReturnType;
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
  
  parseHTML() {
    return [
      {
        tag: 'div.editor-spacer',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'editor-spacer',
        'data-spacer': 'true',
      }),
    ];
  },
  
  addCommands() {
    return {
      setSpacer: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        });
      },
    };
  },
});
