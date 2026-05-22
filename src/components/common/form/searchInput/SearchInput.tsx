import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string
}

const SearchInput = ({
  wrapperClassName = '',
  className = '',
  placeholder = '검색',
  type = 'search',
  ...props
}: SearchInputProps) => {
  return (
    <div className={`relative w-full ${wrapperClassName}`}>
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        type={type}
        placeholder={placeholder}
        className={`h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white ${className}`}
        {...props}
      />
    </div>
  )
}

export default SearchInput
