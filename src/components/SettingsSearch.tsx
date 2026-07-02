/**
 * Settings Search Component
 * Provides search functionality for Jellyfin Web dashboard settings pages
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface SearchableElement {
    element: HTMLElement;
    text: string;
    section?: HTMLElement;
}

interface SettingsSearchProps {
    /** Container ref to search within */
    containerRef: React.RefObject<HTMLElement>;
    /** Debounce delay in ms */
    debounceDelay?: number;
}

export const SettingsSearch: React.FC<SettingsSearchProps> = ({
    containerRef,
    debounceDelay = 150
}) => {
    const [searchText, setSearchText] = useState('');
    const [searchableItems, setSearchableItems] = useState<SearchableElement[]>([]);
    const [originalStates, setOriginalStates] = useState<Map<HTMLElement, boolean>>(new Map());

    /**
     * Index all searchable content in the settings container
     */
    const indexSettings = useCallback(() => {
        if (!containerRef.current) return;

        const items: SearchableElement[] = [];
        const states = new Map<HTMLElement, boolean>();

        // Find all collapsible sections (Material-UI Accordion or custom)
        const sections = containerRef.current.querySelectorAll<HTMLElement>(
            '.MuiAccordion-root, [class*="collapsible"]'
        );

        sections.forEach(section => {
            // Cache expanded/collapsed state
            const isExpanded = section.classList.contains('Mui-expanded')
                              || section.getAttribute('aria-expanded') === 'true';
            states.set(section, isExpanded);

            // Get section title
            const title = section.querySelector<HTMLElement>(
                '.MuiAccordionSummary-content, [class*="title"], h3, h4'
            );

            if (title) {
                const titleText = extractText(title);
                if (titleText) {
                    items.push({
                        element: section,
                        text: titleText.toLowerCase(),
                        section
                    });
                }
            }

            // Find all form elements within this section
            const formElements = section.querySelectorAll<HTMLElement>(
                'label, .MuiFormLabel-root, .MuiFormControlLabel-root, '
                + '.MuiInputLabel-root, .MuiFormHelperText-root, '
                + '[class*="description"], [class*="help"]'
            );

            formElements.forEach(element => {
                const text = extractText(element);
                if (text) {
                    items.push({
                        element,
                        text: text.toLowerCase(),
                        section
                    });
                }
            });
        });

        // Also index top-level form elements (non-collapsible)
        const topLevelElements = containerRef.current.querySelectorAll<HTMLElement>(
            ':scope > label, :scope > .MuiFormControl-root label'
        );

        topLevelElements.forEach(element => {
            const text = extractText(element);
            if (text) {
                items.push({
                    element,
                    text: text.toLowerCase()
                });
            }
        });

        setSearchableItems(items);
        setOriginalStates(states);
    }, [containerRef]);

    /**
     * Extract clean text from an element
     */
    const extractText = (element: HTMLElement): string => {
        return element.textContent?.trim().replace(/\s+/g, ' ') || '';
    };

    /**
     * Clear search and restore original state
     */
    const clearSearch = useCallback(() => {
        if (!containerRef.current) return;

        setSearchText('');

        // Remove all highlights
        const highlights = containerRef.current.querySelectorAll('.settings-search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
                parent.replaceChild(
                    document.createTextNode(highlight.textContent || ''),
                    highlight
                );
                parent.normalize();
            }
        });

        // Restore all sections
        const allSections = containerRef.current.querySelectorAll<HTMLElement>(
            '.MuiAccordion-root, [class*="collapsible"]'
        );

        allSections.forEach(section => {
            section.style.display = '';

            // Restore original expanded/collapsed state
            const originalState = originalStates.get(section);
            if (originalState !== undefined) {
                if (originalState) {
                    expandSection(section);
                } else {
                    collapseSection(section);
                }
            }
        });

        // Show all elements
        searchableItems.forEach(item => {
            item.element.style.display = '';
        });
    }, [containerRef, originalStates, searchableItems]);

    /**
     * Perform search and update UI
     */
    const performSearch = useCallback((query: string) => {
        if (!containerRef.current) return;

        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
            // Clear search - restore everything
            clearSearch();
            return;
        }

        const sectionsWithMatches = new Set<HTMLElement>();
        const matchedElements = new Set<HTMLElement>();

        // Find matches
        searchableItems.forEach(item => {
            if (item.text.includes(lowerQuery)) {
                matchedElements.add(item.element);
                if (item.section) {
                    sectionsWithMatches.add(item.section);
                }
            }
        });

        // Process sections
        const allSections = containerRef.current.querySelectorAll<HTMLElement>(
            '.MuiAccordion-root, [class*="collapsible"]'
        );

        allSections.forEach(section => {
            if (sectionsWithMatches.has(section)) {
                // Show and expand sections with matches
                section.style.display = '';
                expandSection(section);
                highlightMatches(section, lowerQuery);
            } else {
                // Hide sections without matches
                section.style.display = 'none';
            }
        });

        // Show/hide individual elements
        searchableItems.forEach(item => {
            if (!item.section) {
                // Top-level element
                item.element.style.display = matchedElements.has(item.element) ? '' : 'none';
            }
        });
    }, [containerRef, searchableItems, clearSearch]);

    /**
     * Clear search and restore original state
     */
    const clearSearch = useCallback(() => {
        if (!containerRef.current) return;

        setSearchText('');

        // Remove all highlights
        const highlights = containerRef.current.querySelectorAll('.settings-search-highlight');
        highlights.forEach(highlight => {
            const parent = highlight.parentNode;
            if (parent) {
                parent.replaceChild(
                    document.createTextNode(highlight.textContent || ''),
                    highlight
                );
                parent.normalize();
            }
        });

        // Restore all sections
        const allSections = containerRef.current.querySelectorAll<HTMLElement>(
            '.MuiAccordion-root, [class*="collapsible"]'
        );

        allSections.forEach(section => {
            section.style.display = '';

            // Restore original expanded/collapsed state
            const originalState = originalStates.get(section);
            if (originalState !== undefined) {
                if (originalState) {
                    expandSection(section);
                } else {
                    collapseSection(section);
                }
            }
        });

        // Show all elements
        searchableItems.forEach(item => {
            item.element.style.display = '';
        });
    }, [containerRef, originalStates, searchableItems]);

    /**
     * Expand a collapsible section
     */
    const expandSection = (section: HTMLElement) => {
        // Material-UI Accordion
        const button = section.querySelector<HTMLButtonElement>('.MuiAccordionSummary-root');
        if (button && !section.classList.contains('Mui-expanded')) {
            button.click();
        }
    };

    /**
     * Collapse a collapsible section
     */
    const collapseSection = (section: HTMLElement) => {
        // Material-UI Accordion
        const button = section.querySelector<HTMLButtonElement>('.MuiAccordionSummary-root');
        if (button && section.classList.contains('Mui-expanded')) {
            button.click();
        }
    };

    /**
     * Highlight matching text
     */
    const highlightMatches = (container: HTMLElement, query: string) => {
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    if (parent.classList.contains('settings-search-highlight')) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes: Node[] = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        textNodes.forEach(textNode => {
            const text = textNode.textContent || '';
            const lowerText = text.toLowerCase();

            let startIndex = 0;
            let index = lowerText.indexOf(query, startIndex);

            if (index === -1) return;

            const fragment = document.createDocumentFragment();

            while (index !== -1) {
                const before = text.substring(startIndex, index);
                if (before) fragment.appendChild(document.createTextNode(before));

                const match = text.substring(index, index + query.length);
                const highlight = document.createElement('span');
                highlight.className = 'settings-search-highlight';
                highlight.textContent = match;
                fragment.appendChild(highlight);

                startIndex = index + query.length;
                index = lowerText.indexOf(query, startIndex);
            }

            const after = text.substring(startIndex);
            if (after) fragment.appendChild(document.createTextNode(after));

            textNode.parentNode?.replaceChild(fragment, textNode);
        });
    };

    /**
     * Debounced search effect
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(searchText);
        }, debounceDelay);

        return () => clearTimeout(timer);
    }, [searchText, debounceDelay, performSearch]);

    /**
     * Index settings when container is ready
     */
    useEffect(() => {
        // Wait for DOM to be ready
        const timer = setTimeout(() => {
            indexSettings();
        }, 100);

        return () => clearTimeout(timer);
    }, [indexSettings]);

    /**
     * Re-index when container content changes
     */
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new MutationObserver(() => {
            indexSettings();
        });

        observer.observe(containerRef.current, {
            childList: true,
            subtree: true
        });

        return () => observer.disconnect();
    }, [containerRef, indexSettings]);

    return (
        <TextField
            fullWidth
            placeholder='Search settings...'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Escape') {
                    clearSearch();
                }
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position='start'>
                        <SearchIcon />
                    </InputAdornment>
                ),
                endAdornment: searchText && (
                    <InputAdornment position='end'>
                        <IconButton
                            size='small'
                            onClick={clearSearch}
                            edge='end'
                            aria-label='Clear search'
                        >
                            <ClearIcon />
                        </IconButton>
                    </InputAdornment>
                )
            }}
            sx={{
                mb: 3,
                maxWidth: 600
            }}
        />
    );
};

export default SettingsSearch;
