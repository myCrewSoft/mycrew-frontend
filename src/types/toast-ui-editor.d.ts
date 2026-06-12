// Toast UI Editor 3.2.2 exposes runtime entry points without a `types`
// condition, so TypeScript's bundler resolution cannot reach its bundled types.
declare module '@toast-ui/editor' {
  export type EditorMode = 'markdown' | 'wysiwyg'
  export type PreviewStyle = 'tab' | 'vertical'

  export interface EditorOptions {
    el: HTMLElement
    height?: string
    minHeight?: string
    initialValue?: string
    previewStyle?: PreviewStyle
    initialEditType?: EditorMode
    language?: string
    useCommandShortcut?: boolean
    usageStatistics?: boolean
    toolbarItems?: string[][]
    hideModeSwitch?: boolean
    placeholder?: string
    autofocus?: boolean
    events?: {
      change?: () => void
    }
  }

  export default class ToastEditor {
    constructor(options: EditorOptions)

    changeMode(mode: EditorMode, isWithoutFocus?: boolean): void
    exec(command: string, payload?: Record<string, unknown>): void
    getMarkdown(): string
    destroy(): void
  }
}

declare module '@toast-ui/editor/dist/toastui-editor-viewer' {
  export interface ViewerOptions {
    el: HTMLElement
    initialValue?: string
    usageStatistics?: boolean
    theme?: string
  }

  export default class ToastViewer {
    constructor(options: ViewerOptions)

    setMarkdown(markdown: string): void
    destroy(): void
  }
}
