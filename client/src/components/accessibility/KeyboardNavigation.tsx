"use client";

import React, { useEffect } from 'react';

interface KeyboardNavigationProps {
  children: React.ReactNode;
}

export default function KeyboardNavigation({ children }: KeyboardNavigationProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab navigation enhancements
      if (event.key === 'Tab') {
        // Show focus indicators for keyboard users
        document.body.classList.add('using-keyboard');
      }
      
      // Escape key handling for modals/dialogs
      if (event.key === 'Escape') {
        const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (activeModal) {
          const closeButton = activeModal.querySelector('[aria-label*="close"], [data-dismiss="modal"]') as HTMLElement;
          if (closeButton) {
            closeButton.click();
          }
        }
      }
      
      // Arrow key navigation for menus and lists
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const activeElement = document.activeElement;
        if (activeElement?.getAttribute('role') === 'menuitem' || 
            activeElement?.getAttribute('role') === 'option' ||
            activeElement?.closest('[role="menu"]') ||
            activeElement?.closest('[role="listbox"]')) {
          
          event.preventDefault();
          handleArrowNavigation(event);
        }
      }
      
      // Enter/Space for buttons and links
      if (event.key === 'Enter' || event.key === ' ') {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.getAttribute('role') === 'button' || 
            activeElement?.tagName === 'BUTTON') {
          if (event.key === ' ') {
            event.preventDefault();
            activeElement.click();
          }
        }
      }
    };
    
    const handleMouseDown = () => {
      document.body.classList.remove('using-keyboard');
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  return <>{children}</>;
}

function handleArrowNavigation(event: KeyboardEvent) {
  const activeElement = document.activeElement as HTMLElement;
  const container = activeElement.closest('[role="menu"], [role="listbox"], [role="menubar"]');
  
  if (!container) return;
  
  const focusableElements = container.querySelectorAll(
    '[role="menuitem"], [role="option"], button:not([disabled]), a[href]'
  );
  
  const currentIndex = Array.from(focusableElements).indexOf(activeElement);
  let nextIndex = currentIndex;
  
  switch (event.key) {
    case 'ArrowDown':
      nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      break;
    case 'ArrowUp':
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      break;
    case 'ArrowLeft':
      // For horizontal navigation
      nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      break;
    case 'ArrowRight':
      // For horizontal navigation
      nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      break;
  }
  
  const nextElement = focusableElements[nextIndex] as HTMLElement;
  if (nextElement) {
    nextElement.focus();
  }
}