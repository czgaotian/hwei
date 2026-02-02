import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './TiptapEditor.css';
import { 
  BoldOutlined, 
  ItalicOutlined, 
  StrikethroughOutlined, 
  CodeOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  MinusOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { Tooltip } from 'antd';

interface TiptapEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-toolbar">
      <Tooltip title="Bold">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          type="button"
        >
          <BoldOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Italic">
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          type="button"
        >
          <ItalicOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Strike">
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          type="button"
        >
          <StrikethroughOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Code">
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'is-active' : ''}
          type="button"
        >
          <CodeOutlined />
        </button>
      </Tooltip>
      <div style={{ width: 1, backgroundColor: '#eee', margin: '0 4px' }} />
      <Tooltip title="H1">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          type="button"
          style={{ fontWeight: 'bold' }}
        >
          H1
        </button>
      </Tooltip>
      <Tooltip title="H2">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          type="button"
          style={{ fontWeight: 'bold' }}
        >
          H2
        </button>
      </Tooltip>
      <Tooltip title="H3">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          type="button"
          style={{ fontWeight: 'bold' }}
        >
          H3
        </button>
      </Tooltip>
      <div style={{ width: 1, backgroundColor: '#eee', margin: '0 4px' }} />
      <Tooltip title="Bullet List">
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          type="button"
        >
          <UnorderedListOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Ordered List">
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          type="button"
        >
          <OrderedListOutlined />
        </button>
      </Tooltip>
      <div style={{ width: 1, backgroundColor: '#eee', margin: '0 4px' }} />
      <Tooltip title="Horizontal Rule">
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} type="button">
          <MinusOutlined />
        </button>
      </Tooltip>
      <div style={{ flex: 1 }} />
      <Tooltip title="Undo">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          type="button"
        >
          <UndoOutlined />
        </button>
      </Tooltip>
      <Tooltip title="Redo">
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          type="button"
        >
          <RedoOutlined />
        </button>
      </Tooltip>
    </div>
  );
};

const TiptapEditor: React.FC<TiptapEditorProps> = ({ 
  value = '', 
  onChange,
  placeholder = 'Write something...' 
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'tiptap-content',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Call onChange only if content actually changed to avoid cycles if necessary, 
      // but getHTML() comparison is better done in the useEffect if we want to sync back props.
      // Here we just notify parent.
      onChange?.(html === '<p></p>' ? '' : html);
    },
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
    <div className="tiptap-editor-wrapper">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
};

export default TiptapEditor;
