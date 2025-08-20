import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface SearchSuggestion {
  id: number;
  query: string;
  popularity: number;
  type: 'product' | 'suggestion';
  slug?: string;
}

interface SmartSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SmartSearch({ onSearch, placeholder = "Search products...", className = "" }: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Get search suggestions (now includes products)
  const { data: suggestions = [] } = useQuery({
    queryKey: ["/api/search/suggestions", query],
    queryFn: () => fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`).then(res => res.json()),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  // Record search analytics
  const recordSearchMutation = useMutation({
    mutationFn: (searchQuery: string) => apiRequest('/api/search/analytics', {
      method: 'POST',
      body: JSON.stringify({
        query: searchQuery,
        timestamp: new Date().toISOString(),
        sessionId: sessionStorage.getItem('searchSessionId') || 'anonymous'
      })
    })
  });

  useEffect(() => {
    // Generate a session ID for analytics if it doesn't exist
    if (!sessionStorage.getItem('searchSessionId')) {
      sessionStorage.setItem('searchSessionId', Math.random().toString(36).substring(7));
    }
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      recordSearchMutation.mutate(searchQuery.trim());
      // Encode the search query for URL-safe navigation
      const encodedQuery = encodeURIComponent(searchQuery.trim());
      onSearch(encodedQuery);
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch(query);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const selectedSuggestion = suggestions[selectedIndex];
          setQuery(selectedSuggestion.query);
          handleSearch(selectedSuggestion.query);
        } else {
          handleSearch(query);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery("");
    setShowSuggestions(false);
    
    if (suggestion.type === 'product' && suggestion.slug) {
      // Navigate directly to product page
      setLocation(`/products/${suggestion.slug}`);
    } else {
      // Navigate to products page with search query
      setLocation(`/products?search=${encodeURIComponent(suggestion.query)}`);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    }, 100);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="pl-10 pr-4"
        />
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1"
        >
          <div className="py-1">
            {suggestions.map((suggestion: SearchSuggestion, index: number) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                  index === selectedIndex ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {suggestion.type === 'product' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                    <span className="text-gray-900">{suggestion.query}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {suggestion.type === 'product' ? 'Product' : suggestion.popularity > 1 && `${suggestion.popularity} searches`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}