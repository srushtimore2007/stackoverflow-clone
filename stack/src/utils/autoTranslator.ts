// utils/autoTranslator.ts
// Utility for automatically translating DOM elements with specific attributes

import React, { useRef, useEffect } from 'react';
import { useTranslationManager } from '../hooks/useTranslationManager';

/**
 * Auto-translator utility that scans and translates DOM elements
 * 
 * Usage:
 * 1. Add data-translate or data-translate-key attributes to elements
 * 2. Call autoTranslate() to translate all elements
 * 3. Elements will be automatically updated when language changes
 */

export interface AutoTranslateOptions {
  selector?: string;           // Custom selector for elements to translate
  attribute?: string;           // Attribute to check for translation keys
  textAttribute?: string;       // Attribute for direct text translation
  keyAttribute?: string;        // Attribute for i18n key translation
  placeholderAttribute?: string;  // Attribute for placeholder translation
  autoUpdate?: boolean;         // Auto-update on language changes
}

/**
 * Auto-translate DOM elements based on attributes
 */
export class AutoTranslator {
  private options: Required<AutoTranslateOptions>;
  private observer: MutationObserver | null = null;
  private translationManager: any = null;
  private isInitialized = false;

  constructor(options: AutoTranslateOptions = {}) {
    this.options = {
      selector: '[data-translate], [data-translate-key], [data-placeholder]',
      attribute: 'data-translate',
      textAttribute: 'data-translate',
      keyAttribute: 'data-translate-key',
      placeholderAttribute: 'data-placeholder',
      autoUpdate: true,
      ...options
    };
  }

  /**
   * Initialize the auto-translator with translation manager
   */
  async initialize(translationManager: any): Promise<void> {
    this.translationManager = translationManager;
    this.isInitialized = true;

    // Initial translation
    await this.translateAllElements();

    // Set up auto-update if enabled
    if (this.options.autoUpdate) {
      this.setupAutoUpdate();
    }
  }

  /**
   * Translate all elements matching the selector
   */
  async translateAllElements(): Promise<void> {
    if (!this.isInitialized || !this.translationManager) {
      console.warn('AutoTranslator not initialized');
      return;
    }

    const elements = document.querySelectorAll(this.options.selector);
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i] as HTMLElement;
      await this.translateElement(element);
    }
  }

  /**
   * Translate a single element
   */
  async translateElement(element: HTMLElement): Promise<void> {
    try {
      // Check for direct text translation
      const translateText = element.getAttribute(this.options.textAttribute);
      if (translateText) {
        const translated = await this.translationManager.dt(translateText);
        this.updateElementText(element, translated);
        return;
      }

      // Check for i18n key translation
      const translateKey = element.getAttribute(this.options.keyAttribute);
      if (translateKey) {
        // Try static translation first
        const staticTranslation = this.translationManager.t(translateKey);
        
        if (staticTranslation !== translateKey) {
          // Static translation found
          this.updateElementText(element, staticTranslation);
        } else {
          // Use dynamic translation
          const dynamicTranslation = await this.translationManager.dt(translateKey);
          this.updateElementText(element, dynamicTranslation);
        }
        return;
      }

      // Check for placeholder translation
      const placeholderText = element.getAttribute(this.options.placeholderAttribute);
      if (placeholderText) {
        const translated = await this.translationManager.dt(placeholderText);
        this.updateElementPlaceholder(element, translated);
        return;
      }

      // Check for child elements with translation attributes
      const childElements = element.querySelectorAll(
        `[${this.options.textAttribute}], [${this.options.keyAttribute}], [${this.options.placeholderAttribute}]`
      );
      
      for (let i = 0; i < childElements.length; i++) {
        await this.translateElement(childElements[i] as HTMLElement);
      }

    } catch (error) {
      console.error('Failed to translate element:', element, error);
    }
  }

  /**
   * Update element text content
   */
  private updateElementText(element: HTMLElement, text: string): void {
    // Store original text for re-translation
    if (!element.hasAttribute('data-original-text')) {
      element.setAttribute('data-original-text', 
        element.textContent || element.getAttribute('placeholder') || ''
      );
    }

    // Update based on element type
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      (element as HTMLInputElement | HTMLTextAreaElement).placeholder = text;
    } else {
      element.textContent = text;
    }
  }

  /**
   * Update element placeholder
   */
  private updateElementPlaceholder(element: HTMLElement, text: string): void {
    if (!element.hasAttribute('data-original-placeholder')) {
      element.setAttribute('data-original-placeholder', 
        element.getAttribute('placeholder') || ''
      );
    }

    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      (element as HTMLInputElement | HTMLTextAreaElement).placeholder = text;
    }
  }

  /**
   * Set up automatic updates when DOM changes
   */
  private setupAutoUpdate(): void {
    if (!this.translationManager) return;

    // Listen for language changes
    const unsubscribe = this.translationManager.addListener?.(() => {
      setTimeout(() => this.translateAllElements(), 100);
    });

    // Listen for DOM changes
    this.observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Check if the new element or its children have translation attributes
              if (element.hasAttribute(this.options.textAttribute) ||
                  element.hasAttribute(this.options.keyAttribute) ||
                  element.hasAttribute(this.options.placeholderAttribute) ||
                  element.querySelector(this.options.selector)) {
                shouldTranslate = true;
              }
            }
          });
        }
      });

      if (shouldTranslate) {
        // Small delay to ensure DOM is ready
        setTimeout(() => this.translateAllElements(), 50);
      }
    });

    // Start observing
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Re-translate all elements (useful for language changes)
   */
  async retranslate(): Promise<void> {
    if (!this.isInitialized) return;

    // Get all elements with original text
    const elementsWithOriginal = document.querySelectorAll('[data-original-text], [data-original-placeholder]');
    
    for (let i = 0; i < elementsWithOriginal.length; i++) {
      const element = elementsWithOriginal[i] as HTMLElement;
      
      // Get original text
      const originalText = element.getAttribute('data-original-text');
      const originalPlaceholder = element.getAttribute('data-original-placeholder');
      
      if (originalText) {
        const translated = await this.translationManager.dt(originalText);
        this.updateElementText(element, translated);
      }
      
      if (originalPlaceholder) {
        const translated = await this.translationManager.dt(originalPlaceholder);
        this.updateElementPlaceholder(element, translated);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isInitialized = false;
  }
}

/**
 * React hook for auto-translation
 */
export function useAutoTranslator(options: AutoTranslateOptions = {}) {
  const translationManager = useTranslationManager(options);
  const autoTranslatorRef = useRef<AutoTranslator | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !autoTranslatorRef.current) {
      autoTranslatorRef.current = new AutoTranslator(options);
      
      // Initialize when translation manager is ready
      autoTranslatorRef.current.initialize(translationManager).catch(console.error);
    }

    return () => {
      if (autoTranslatorRef.current) {
        autoTranslatorRef.current.destroy();
        autoTranslatorRef.current = null;
      }
    };
  }, [translationManager]);

  // Re-initialize when options change
  useEffect(() => {
    if (autoTranslatorRef.current) {
      autoTranslatorRef.current.destroy();
      autoTranslatorRef.current = new AutoTranslator(options);
      autoTranslatorRef.current.initialize(translationManager).catch(console.error);
    }
  }, [options]);

  return {
    translateAll: () => autoTranslatorRef.current?.translateAllElements(),
    retranslate: () => autoTranslatorRef.current?.retranslate(),
    translateElement: (element: HTMLElement) => 
      autoTranslatorRef.current?.translateElement(element)
  };
}

// Create global instance for non-React usage
const globalAutoTranslator = new AutoTranslator();

/**
 * Initialize global auto-translator (call this in your app initialization)
 */
export async function initializeAutoTranslator(translationManager: any): Promise<void> {
  await globalAutoTranslator.initialize(translationManager);
}

/**
 * Global translate function for non-React usage
 */
export async function translateElement(element: HTMLElement): Promise<void> {
  await globalAutoTranslator.translateElement(element);
}

/**
 * Global retranslate function for non-React usage
 */
export async function retranslateAll(): Promise<void> {
  await globalAutoTranslator.retranslate();
}
