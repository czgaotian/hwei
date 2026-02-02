import { useTiptap, useEditorState } from '@tiptap/react';
import { createFromIconfontCN } from '@ant-design/icons';
import { Tooltip, Select, Divider } from 'antd';

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_5121989_x07ni966ywq.js',
});

const MenuBar = () => {
  const { editor, isReady } = useTiptap();

  // Use useEditorState to subscribe to specific state changes
  // This prevents unnecessary re-renders of the entire toolbar
  const canUndo = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.can().chain().focus().undo().run() ?? false,
  });

  const canRedo = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.can().chain().focus().redo().run() ?? false,
  });

  const headingLevel = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor?.isActive('heading', { level: 1 })) return 'h1';
      if (ctx.editor?.isActive('heading', { level: 2 })) return 'h2';
      if (ctx.editor?.isActive('heading', { level: 3 })) return 'h3';
      return undefined;
    },
  });

  const listType = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor?.isActive('bulletList')) return 'bullet';
      if (ctx.editor?.isActive('orderedList')) return 'ordered';
      return undefined;
    },
  });

  const isTaskListActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('taskList') ?? false,
  });

  const isBlockquoteActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('blockquote') ?? false,
  });

  const isCodeBlockActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('codeBlock') ?? false,
  });

  const isBoldActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('bold') ?? false,
  });

  const canBold = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.can().chain().focus().toggleBold().run() ?? false,
  });

  const isItalicActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('italic') ?? false,
  });

  const canItalic = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.can().chain().focus().toggleItalic().run() ?? false,
  });

  const isStrikeActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('strike') ?? false,
  });

  const canStrike = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.can().chain().focus().toggleStrike().run() ?? false,
  });

  const isCodeActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('code') ?? false,
  });

  const canCode = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.can().chain().focus().toggleCode().run() ?? false,
  });

  const isUnderlineActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('underline') ?? false,
  });

  const isHighlightActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('highlight') ?? false,
  });

  const isLinkActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('link') ?? false,
  });

  const isSuperscriptActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('superscript') ?? false,
  });

  const isSubscriptActive = useEditorState({
    editor,
    selector: (ctx) => ctx.editor?.isActive('subscript') ?? false,
  });

  const textAlign = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor?.isActive({ textAlign: 'left' })) return 'left';
      if (ctx.editor?.isActive({ textAlign: 'center' })) return 'center';
      if (ctx.editor?.isActive({ textAlign: 'right' })) return 'right';
      if (ctx.editor?.isActive({ textAlign: 'justify' })) return 'justify';
      return undefined;
    },
  });

  if (!isReady || !editor) {
    return null;
  }

  return (
    <div className="tiptap-toolbar">
      {/* Undo/Redo */}
      <Tooltip title="Undo">
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!canUndo}
          type="button"
        >
          <IconFont type="icon-undo" />
        </button>
      </Tooltip>
      <Tooltip title="Redo">
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!canRedo}
          type="button"
        >
          <IconFont type="icon-redo" />
        </button>
      </Tooltip>
      
      <Divider orientation="vertical"  />
      
      {/* Heading Selector */}
      <Select
        value={headingLevel}
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
        value={listType}
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
          className={isTaskListActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-task-list" />
        </button>
      </Tooltip>
      
      <Tooltip title="Block Quote">
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={isBlockquoteActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-quote" />
        </button>
      </Tooltip>

            
      {/* Code Block */}
      <Tooltip title="Code Block">
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={isCodeBlockActive ? 'is-active' : ''}
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
          disabled={!canBold}
          className={isBoldActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-bold" />
        </button>
      </Tooltip>
      <Tooltip title="Italic">
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!canItalic}
          className={isItalicActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-italic" />
        </button>
      </Tooltip>
      <Tooltip title="Strike">
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!canStrike}
          className={isStrikeActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-strike" />
        </button>
      </Tooltip>
      <Tooltip title="Code">
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!canCode}
          className={isCodeActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-code" />
        </button>
      </Tooltip>
      
      {/* New formatting options */}
      <Tooltip title="Underline">
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={isUnderlineActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-underline" />
        </button>
      </Tooltip>
      
      <Tooltip title="Highlight">
        <button
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={isHighlightActive ? 'is-active' : ''}
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
          className={isLinkActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-link" />
        </button>
      </Tooltip>
      
      <Tooltip title="Superscript">
        <button
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={isSuperscriptActive ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-superscript" />
        </button>
      </Tooltip>
      
      <Tooltip title="Subscript">
        <button
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={isSubscriptActive ? 'is-active' : ''}
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
          className={textAlign === 'left' ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-left" />
        </button>
      </Tooltip>
      
      <Tooltip title="Align Center">
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={textAlign === 'center' ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-center" />
        </button>
      </Tooltip>
      
      <Tooltip title="Align Right">
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={textAlign === 'right' ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-right" />
        </button>
      </Tooltip>
      
      <Tooltip title="Justify">
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={textAlign === 'justify' ? 'is-active' : ''}
          type="button"
        >
          <IconFont type="icon-align-justify" />
        </button>
      </Tooltip>
    </div>
  );
};

export default MenuBar;
