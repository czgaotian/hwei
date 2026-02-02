import { useTiptap } from '@tiptap/react';
import { createFromIconfontCN } from '@ant-design/icons';
import { Tooltip, Select, Divider } from 'antd';
import { useEffect, useState } from 'react';

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_5121989_x07ni966ywq.js',
});

const MenuBar = () => {
  const { editor, isReady } = useTiptap();


  if (!isReady || !editor) {
    return null;
  }

  return (
    <div className="tiptap-toolbar">
      {/* Undo/Redo */}
      <Tooltip title="Undo">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          type="button"
        >
          <IconFont type="icon-undo" />
        </button>
      </Tooltip>
      <Tooltip title="Redo">
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          type="button"
        >
          <IconFont type="icon-redo" />
        </button>
      </Tooltip>
      
      <Divider orientation="vertical"  />
      
      {/* Heading Selector */}
      <Select
        value={
          editor.isActive('heading', { level: 1 }) ? 'h1' :
          editor.isActive('heading', { level: 2 }) ? 'h2' :
          editor.isActive('heading', { level: 3 }) ? 'h3' :
          undefined
        }
        placeholder="Normal"
        onChange={(value) => {
          const level = parseInt(value.replace('h', '')) as 1 | 2 | 3;
          editor.chain().focus().toggleHeading({ level }).run();
        }}
        style={{ width: 120 }}
        size="small"
        options={[
          { 
            value: 'h1', 
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconFont type="icon-h1" />
                <span>Heading 1</span>
              </span>
            )
          },
          { 
            value: 'h2', 
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconFont type="icon-h2" />
                <span>Heading 2</span>
              </span>
            )
          },
          { 
            value: 'h3', 
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconFont type="icon-h3" />
                <span>Heading 3</span>
              </span>
            )
          },
        ]}
      />
      
      {/* List Selector */}
      <Select
        value={
          editor.isActive('bulletList') ? 'bullet' :
          editor.isActive('orderedList') ? 'ordered' :
          undefined
        }
        placeholder={<IconFont type="icon-unordered-list" />}
        onChange={(value) => {
          if (value === 'bullet') {
            editor.chain().focus().toggleBulletList().run();
          } else if (value === 'ordered') {
            editor.chain().focus().toggleOrderedList().run();
          }
        }}
        style={{ width: 50 }}
        size="small"
        options={[
          { 
            value: 'bullet', 
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconFont type="icon-unordered-list" />
                <span>Bullet List</span>
              </span>
            )
          },
          { 
            value: 'ordered', 
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconFont type="icon-ordered-list" />
                <span>Ordered List</span>
              </span>
            )
          },
        ]}
      />
      
      {/* Task List */}
      <Tooltip title="Task List">
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={editor.isActive('taskList') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-task-list" />
        </button>
      </Tooltip>
      
      <Tooltip title="Block Quote">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-quote" />
        </button>
      </Tooltip>

            
      {/* Code Block */}
      <Tooltip title="Code Block">
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-code-block" />
        </button>
      </Tooltip>
      
      <Divider orientation="vertical" />
      
      {/* Text Formatting */}
      <Tooltip title="Bold">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-bold" />
        </button>
      </Tooltip>
      <Tooltip title="Italic">
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-italic" />
        </button>
      </Tooltip>
      <Tooltip title="Strike">
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-strike" />
        </button>
      </Tooltip>
      <Tooltip title="Code">
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={editor.isActive('code') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-code" />
        </button>
      </Tooltip>
      
      {/* New formatting options */}
      <Tooltip title="Underline">
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-underline" />
        </button>
      </Tooltip>
      
      <Tooltip title="Highlight">
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={editor.isActive('highlight') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-highlight" />
        </button>
      </Tooltip>
      
      <Tooltip title="Link">
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={editor.isActive('link') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-link" />
        </button>
      </Tooltip>
      
      <Tooltip title="Superscript">
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={editor.isActive('superscript') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-superscript" />
        </button>
      </Tooltip>
      
      <Tooltip title="Subscript">
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={editor.isActive('subscript') ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-subscript" />
        </button>
      </Tooltip>
      
      <Divider orientation="vertical" />
      
      {/* Text Alignment */}
      <Tooltip title="Align Left">
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-left" />
        </button>
      </Tooltip>
      
      <Tooltip title="Align Center">
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-center" />
        </button>
      </Tooltip>
      
      <Tooltip title="Align Right">
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-right" />
        </button>
      </Tooltip>
      
      <Tooltip title="Justify">
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={editor.isActive({ textAlign: 'justify' }) ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-justify" />
        </button>
      </Tooltip>
    </div>
  );
};

export default MenuBar;
