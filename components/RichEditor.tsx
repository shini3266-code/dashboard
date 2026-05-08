'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { useEffect } from 'react'

interface Props {
  content: string
  onChange: (html: string) => void
  editable?: boolean
}

const COLORS = ['#e2e8f0', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#64748b']

function ToolbarBtn({ onClick, active, title, children }: {
  onClick: () => void
  active?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? 'var(--accent)' : 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 4, padding: '3px 7px',
        color: active ? '#fff' : 'var(--text)',
        cursor: 'pointer', fontSize: 12, fontWeight: 600,
      }}
    >
      {children}
    </button>
  )
}

export default function RichEditor({ content, onChange, editable = true }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      //Table.configure({ resizable: true }),
      Table,
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content])

  useEffect(() => {
    if (editor) editor.setEditable(editable)
  }, [editable, editor])

  if (!editor) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* 툴바 */}
      {editable && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 4, padding: '8px',
          background: 'var(--surface2)', borderRadius: '8px 8px 0 0',
          border: '1px solid var(--border)', borderBottom: 'none',
        }}>
          {/* 텍스트 스타일 */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="볼드">
            <b>B</b>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="이탤릭">
            <i>I</i>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄">
            <u>U</u>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="취소선">
            <s>S</s>
          </ToolbarBtn>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* 제목 */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="제목1">
            H1
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목2">
            H2
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목3">
            H3
          </ToolbarBtn>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* 정렬 */}
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">≡</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">≡</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">≡</ToolbarBtn>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* 목록 */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호">• 목록</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">1. 목록</ToolbarBtn>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* 인용, 코드 */}
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">❝</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="코드블록">{`</>`}</ToolbarBtn>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* 표 */}
          <ToolbarBtn
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="표 삽입"
          >
            표
          </ToolbarBtn>
          {editor.isActive('table') && (
            <>
              <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="열 추가">열+</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="열 삭제">열-</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="행 추가">행+</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()} title="행 삭제">행-</ToolbarBtn>
              <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} title="표 삭제">표삭제</ToolbarBtn>
            </>
          )}

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* 글씨 색상 */}
          {COLORS.map(c => (
            <div
              key={c}
              onClick={() => editor.chain().focus().setColor(c).run()}
              title={c}
              style={{
                width: 18, height: 18, borderRadius: '50%', background: c,
                cursor: 'pointer', border: '2px solid',
                borderColor: editor.isActive('textStyle', { color: c }) ? 'white' : 'transparent',
                flexShrink: 0,
              }}
            />
          ))}

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* 구분선 */}
          <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">─</ToolbarBtn>

          {/* 실행취소/재실행 */}
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="실행취소">↩</ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="재실행">↪</ToolbarBtn>
        </div>
      )}

      {/* 에디터 영역 */}
      <div style={{
        flex: 1, overflow: 'auto',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: editable ? '0 0 8px 8px' : 8,
        padding: '16px',
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* 에디터 스타일 */}
      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 400px;
          font-size: 14px;
          line-height: 1.8;
          color: var(--text);
        }
        .ProseMirror p { margin-bottom: 8px; }
        .ProseMirror h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; margin-top: 20px; }
        .ProseMirror h2 { font-size: 20px; font-weight: 700; margin-bottom: 10px; margin-top: 16px; }
        .ProseMirror h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; margin-top: 12px; }
        .ProseMirror ul { padding-left: 20px; margin-bottom: 8px; }
        .ProseMirror ol { padding-left: 20px; margin-bottom: 8px; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 12px;
          color: var(--muted);
          margin: 8px 0;
        }
        .ProseMirror code {
          background: var(--surface2);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
        }
        .ProseMirror pre {
          background: var(--surface2);
          padding: 12px;
          border-radius: 8px;
          overflow-x: auto;
          margin-bottom: 8px;
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 16px 0;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 12px;
        }
        .ProseMirror th, .ProseMirror td {
          border: 1px solid var(--border);
          padding: 8px 12px;
          text-align: left;
          min-width: 80px;
        }
        .ProseMirror th {
          background: var(--surface2);
          font-weight: 700;
        }
        .ProseMirror .selectedCell:after {
          background: rgba(59,130,246,0.2);
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--muted);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}