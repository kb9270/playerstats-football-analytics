import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

export function usePlayerSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: searchResults, isLoading, error } = useQuery({
    queryKey: [`/api/players/search?q=${debouncedQuery}`],
    enabled: debouncedQuery.length > 2,
  });

  // Debounce search query
  const debounceSearch = useCallback((query: string) => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    debounceSearch(query);
  }, [debounceSearch]);

  return {
    searchQuery,
    searchResults: searchResults || [],
    isLoading,
    error,
    handleSearch,
  };
}
