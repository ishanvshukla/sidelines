import { useState, useRef, useEffect, useId } from 'react';
import type { SportTeamConfig } from '../../types/news';

interface Props {
  config: SportTeamConfig;
  selected: string[];
  onChange: (ids: string[]) => void;
  sportColor: string;
  sportLabel: string;
}

export default function PlayerCombobox({ config, selected, onChange, sportColor, sportLabel }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  }

  const allItems = config.groups.flatMap((g) => g.items);
  const lq = query.toLowerCase();

  const filteredGroups = query
    ? [{ label: 'Results', items: allItems.filter((item) => item.name.toLowerCase().includes(lq)) }]
    : config.groups;

  const hasResults = filteredGroups.some((g) => g.items.length > 0);

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  const selectedItems = allItems.filter((item) => selected.includes(item.id));

  const groupLabels = config.groups.map((g) => g.label.toLowerCase()).join(' & ');
  const placeholder = `Search ${sportLabel} ${groupLabels}...`;

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-text transition-colors"
        style={{ borderColor: open ? sportColor : '#2a2410', backgroundColor: '#111' }}
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <svg className="w-4 h-4 flex-shrink-0 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          role="combobox"
        />
        {query ? (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery('');
              inputRef.current?.focus();
            }}
            className="text-gray-500 hover:text-gray-300 text-xl leading-none"
          >
            ×
          </button>
        ) : (
          <svg className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          id={listId}
          className="absolute z-20 w-full mt-1 rounded-lg border border-[#2a2410] bg-[#0e0e0e] max-h-72 overflow-y-auto shadow-2xl"
        >
          {!hasResults ? (
            <p className="text-gray-600 text-sm p-4 text-center">No results for "{query}"</p>
          ) : (
            filteredGroups.map((group, gi) =>
              group.items.length === 0 ? null : (
                <div key={gi}>
                  {config.groups.length > 1 && !query && (
                    <p className="sticky top-0 bg-[#0e0e0e] text-xs font-oswald uppercase tracking-widest text-gold-dim px-3 pt-3 pb-1.5 border-b border-[#1a1a0a]">
                      {group.label}
                    </p>
                  )}
                  {group.items.map((item) => {
                    const isSel = selected.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          toggle(item.id);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white/[0.04] transition-colors"
                      >
                        <span
                          className="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: isSel ? sportColor : '#444',
                            backgroundColor: isSel ? sportColor : 'transparent',
                          }}
                        >
                          {isSel && (
                            <span className="text-black text-[10px] font-bold leading-none">✓</span>
                          )}
                        </span>
                        <span style={{ color: isSel ? sportColor : '#9ca3af' }}>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              )
            )
          )}
        </div>
      )}

      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-inter"
              style={{
                backgroundColor: `${sportColor}1a`,
                color: sportColor,
                border: `1px solid ${sportColor}33`,
              }}
            >
              {item.name}
              <button
                onClick={() => toggle(item.id)}
                className="hover:opacity-70 leading-none ml-0.5"
                style={{ color: sportColor }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
