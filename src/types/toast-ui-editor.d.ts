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
    getMarkdown(): string
    destroy(): void
  }
}
