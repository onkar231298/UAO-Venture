import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import { Extension } from '@tiptap/core';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Highlighter, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link as LinkIcon, 
  Unlink, 
  Undo, 
  Redo,
  Quote,
  Minus,
  Type,
  Palette,
  ChevronDown,
  ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useCallback, useEffect, useRef } from 'react';

const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .removeEmptyTextStyle()
          .run();
      },
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  onImageDrop?: (file: File) => Promise<string | null>;
}

const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '14px' },
  { label: 'Medium', value: '16px' },
  { label: 'Large', value: '18px' },
  { label: 'XL', value: '20px' },
  { label: '2XL', value: '24px' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bfdbfe' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Orange', color: '#fed7aa' },
  { name: 'Purple', color: '#ddd6fe' },
];

const TEXT_COLORS = [
  { name: 'Default', color: 'inherit' },
  { name: 'Black', color: '#000000' },
  { name: 'Dark Gray', color: '#4b5563' },
  { name: 'Red', color: '#dc2626' },
  { name: 'Orange', color: '#ea580c' },
  { name: 'Green', color: '#16a34a' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Purple', color: '#9333ea' },
];

export default function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Write your email here...",
  minHeight = "200px",
  className = "",
  onImageDrop
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const onImageDropRef = useRef(onImageDrop);
  
  useEffect(() => {
    onImageDropRef.current = onImageDrop;
  }, [onImageDrop]);

  const handleImageUpload = useCallback(async (file: File) => {
    if (!onImageDropRef.current) return;
    
    setUploadingImage(true);
    try {
      const imageUrl = await onImageDropRef.current(file);
      if (imageUrl && editorRef.current) {
        editorRef.current.chain().focus().setImage({ src: imageUrl }).run();
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
    } finally {
      setUploadingImage(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontSize,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[${minHeight}] px-3 py-2`,
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length > 0) {
          const file = event.clipboardData.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${className}`}>
      <div className="border-b bg-gray-50 p-1 flex flex-wrap items-center gap-0.5">
        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
            data-testid="editor-bold"
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
            data-testid="editor-italic"
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
            data-testid="editor-underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Strikethrough"
            data-testid="editor-strike"
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Font Size Selector */}
        <div className="flex items-center">
          <Select
            onValueChange={(value) => {
              if (value === 'default') {
                (editor.chain().focus() as any).unsetFontSize().run();
              } else {
                (editor.chain().focus() as any).setFontSize(value).run();
              }
            }}
          >
            <SelectTrigger className="h-8 w-[90px] text-xs" data-testid="editor-font-size">
              <Type className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" data-testid="editor-highlight-menu">
                <Highlighter className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.color }}
                    onClick={() => editor.chain().focus().toggleHighlight({ color: color.color }).run()}
                    title={color.name}
                    data-testid={`editor-highlight-${color.name.toLowerCase()}`}
                  />
                ))}
                <button
                  className="w-6 h-6 rounded border bg-gray-100 hover:scale-110 transition-transform flex items-center justify-center"
                  onClick={() => editor.chain().focus().unsetHighlight().run()}
                  title="Remove highlight"
                  data-testid="editor-highlight-remove"
                >
                  ✕
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2" data-testid="editor-text-color-menu">
                <Palette className="h-4 w-4" />
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="start">
              <div className="flex gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform flex items-center justify-center"
                    style={{ backgroundColor: color.color === 'inherit' ? '#f3f4f6' : color.color }}
                    onClick={() => {
                      if (color.color === 'inherit') {
                        editor.chain().focus().unsetColor().run();
                      } else {
                        editor.chain().focus().setColor(color.color).run();
                      }
                    }}
                    title={color.name}
                    data-testid={`editor-color-${color.name.toLowerCase().replace(' ', '-')}`}
                  >
                    {color.color === 'inherit' ? 'A' : ''}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="Bullet List"
            data-testid="editor-bullet-list"
          >
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('orderedList')}
            onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="Numbered List"
            data-testid="editor-ordered-list"
          >
            <ListOrdered className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'left' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
            aria-label="Align Left"
            data-testid="editor-align-left"
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'center' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
            aria-label="Align Center"
            data-testid="editor-align-center"
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: 'right' })}
            onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
            aria-label="Align Right"
            data-testid="editor-align-right"
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center">
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
            data-testid="editor-quote"
          >
            <Quote className="h-4 w-4" />
          </Toggle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            data-testid="editor-hr"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center">
          <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
            <PopoverTrigger asChild>
              <Toggle
                size="sm"
                pressed={editor.isActive('link')}
                onPressedChange={() => {
                  if (editor.isActive('link')) {
                    removeLink();
                  } else {
                    setShowLinkInput(true);
                  }
                }}
                aria-label="Link"
                data-testid="editor-link"
              >
                <LinkIcon className="h-4 w-4" />
              </Toggle>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="start">
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setLink();
                    }
                  }}
                  data-testid="editor-link-input"
                />
                <Button size="sm" onClick={setLink} data-testid="editor-link-apply">
                  Apply
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          {editor.isActive('link') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={removeLink}
              data-testid="editor-unlink"
            >
              <Unlink className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Image upload button */}
        {onImageDrop && (
          <>
            <div className="flex items-center">
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                    e.target.value = '';
                  }
                }}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingImage}
                data-testid="editor-image"
                title="Insert image (or drag & drop)"
              >
                {uploadingImage ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Separator orientation="vertical" className="h-6 mx-1" />
          </>
        )}

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            data-testid="editor-undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            data-testid="editor-redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <EditorContent 
        editor={editor} 
        className="min-h-[200px]"
        data-testid="rich-text-editor-content"
      />
    </div>
  );
}
