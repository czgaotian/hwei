import React, { useEffect } from 'react';
import { useEditor, Tiptap } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { common, createLowlight } from 'lowlight';
import './TiptapEditor.css';
import MenuBar from './MenuBar';

interface TiptapEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  value = '', 
  onChange,
  placeholder = 'Write something...' 
}) => {
  const lowlight = createLowlight(common);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable the default code block
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'tiptap-link',
        },
      }),
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'tiptap-content',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === '<p></p>' ? '' : html);
    },
    shouldRerenderOnTransaction: false, // Optimize performance by preventing unnecessary re-renders
  });

  // Sync value from props to editor
  useEffect(() => {
    if (editor && value !== undefined) {
       // Only update if the content is different to preserve cursor position
       if (editor.getHTML() !== value) {
         // Check if value is logically empty (e.g. just a paragraph)
         if (value === '' && editor.getHTML() === '<p></p>') {
            return;
         }
         editor.commands.setContent(value);
       }
    }
  }, [value, editor]);

  return (
    <Tiptap instance={editor}>
      <Tiptap.Loading>
        <div className="tiptap-editor-wrapper">
          <div className="tiptap-toolbar">{placeholder}</div>
        </div>
      </Tiptap.Loading>
      <div className="tiptap-editor-wrapper">
        <MenuBar />
        <Tiptap.Content className="tiptap-content" />
      </div>
    </Tiptap>
  );
};

export default TiptapEditor;
