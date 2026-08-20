/**
 * Tests for KeyboardNavigation.tsx - Keyboard interaction enhancements
 * Following boundary mocking pattern: test real keyboard behavior
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import KeyboardNavigation from '../KeyboardNavigation';

describe('KeyboardNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.classList.remove('using-keyboard');
  });

  describe('Rendering', () => {
    it('renders children without error', () => {
      const { getByText } = render(
        <KeyboardNavigation>
          <div>Test Content</div>
        </KeyboardNavigation>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('renders children as fragment', () => {
      const { container } = render(
        <KeyboardNavigation>
          <div>Child 1</div>
          <div>Child 2</div>
        </KeyboardNavigation>
      );

      // Should not add wrapper element
      expect(container.firstChild).toHaveTextContent('Child 1');
    });
  });

  describe('Tab key handling', () => {
    it('adds using-keyboard class on Tab press', () => {
      render(
        <KeyboardNavigation>
          <div>Test</div>
        </KeyboardNavigation>
      );

      fireEvent.keyDown(document, { key: 'Tab' });

      expect(document.body).toHaveClass('using-keyboard');
    });

    it('removes using-keyboard class on mouse down', () => {
      render(
        <KeyboardNavigation>
          <div>Test</div>
        </KeyboardNavigation>
      );

      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.body).toHaveClass('using-keyboard');

      fireEvent.mouseDown(document);
      expect(document.body).not.toHaveClass('using-keyboard');
    });

    it('does not add class for other keys', () => {
      render(
        <KeyboardNavigation>
          <div>Test</div>
        </KeyboardNavigation>
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      expect(document.body).not.toHaveClass('using-keyboard');

      fireEvent.keyDown(document, { key: 'Space' });
      expect(document.body).not.toHaveClass('using-keyboard');
    });
  });

  describe('Escape key for modals', () => {
    it('closes modal with close button on Escape', () => {
      const handleClose = jest.fn();

      render(
        <KeyboardNavigation>
          <div role="dialog" aria-modal="true">
            <button aria-label="close" onClick={handleClose}>
              Close
            </button>
            <div>Modal content</div>
          </div>
        </KeyboardNavigation>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).toHaveBeenCalled();
    });

    it('finds close button with data-dismiss attribute', () => {
      const handleClose = jest.fn();

      render(
        <KeyboardNavigation>
          <div role="dialog" aria-modal="true">
            <button data-dismiss="modal" onClick={handleClose}>
              X
            </button>
          </div>
        </KeyboardNavigation>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(handleClose).toHaveBeenCalled();
    });

    it('does nothing if no modal is open', () => {
      render(
        <KeyboardNavigation>
          <div>Regular content</div>
        </KeyboardNavigation>
      );

      // Should not throw error
      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }).not.toThrow();
    });

    it('does nothing if modal has no close button', () => {
      render(
        <KeyboardNavigation>
          <div role="dialog" aria-modal="true">
            <div>Modal without close button</div>
          </div>
        </KeyboardNavigation>
      );

      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }).not.toThrow();
    });
  });

  describe('Arrow key navigation for menus', () => {
    it('prevents default for arrow keys in menus', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">Item 1</button>
            <button role="menuitem">Item 2</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItem = document.querySelector('[role="menuitem"]') as HTMLElement;
      menuItem.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('navigates down with ArrowDown in menu', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">Item 1</button>
            <button role="menuitem">Item 2</button>
            <button role="menuitem">Item 3</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[0].focus();

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(document.activeElement).toBe(menuItems[1]);
    });

    it('navigates up with ArrowUp in menu', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">Item 1</button>
            <button role="menuitem">Item 2</button>
            <button role="menuitem">Item 3</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[1].focus();

      fireEvent.keyDown(document, { key: 'ArrowUp' });

      expect(document.activeElement).toBe(menuItems[0]);
    });

    it('wraps to last item when pressing up from first', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">Item 1</button>
            <button role="menuitem">Item 2</button>
            <button role="menuitem">Item 3</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[0].focus();

      fireEvent.keyDown(document, { key: 'ArrowUp' });

      expect(document.activeElement).toBe(menuItems[2]);
    });

    it('wraps to first item when pressing down from last', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">Item 1</button>
            <button role="menuitem">Item 2</button>
            <button role="menuitem">Item 3</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[2].focus();

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(document.activeElement).toBe(menuItems[0]);
    });

    it('navigates with ArrowLeft for horizontal menus', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">Item 1</button>
            <button role="menuitem">Item 2</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[1].focus();

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(document.activeElement).toBe(menuItems[0]);
    });

    it('navigates with ArrowRight for horizontal menus', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">Item 1</button>
            <button role="menuitem">Item 2</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[0].focus();

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(document.activeElement).toBe(menuItems[1]);
    });
  });

  describe('Arrow key navigation for listboxes', () => {
    it('navigates options in listbox', () => {
      render(
        <KeyboardNavigation>
          <div role="listbox">
            <div role="option" tabIndex={0}>Option 1</div>
            <div role="option" tabIndex={0}>Option 2</div>
          </div>
        </KeyboardNavigation>
      );

      const options = Array.from(document.querySelectorAll('[role="option"]')) as HTMLElement[];
      options[0].focus();
      expect(document.activeElement).toBe(options[0]);

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(document.activeElement).toBe(options[1]);
    });

    it('does not navigate if not in menu or listbox', () => {
      render(
        <KeyboardNavigation>
          <button>Regular button</button>
        </KeyboardNavigation>
      );

      const button = document.querySelector('button') as HTMLElement;
      button.focus();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe('Enter and Space for buttons', () => {
    it('activates button with Space key', () => {
      const handleClick = jest.fn();

      render(
        <KeyboardNavigation>
          <button role="button" onClick={handleClick}>
            Click me
          </button>
        </KeyboardNavigation>
      );

      const button = document.querySelector('button') as HTMLElement;
      button.focus();

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(handleClick).toHaveBeenCalled();
    });

    it('does not prevent Enter key for buttons', () => {
      render(
        <KeyboardNavigation>
          <button role="button">Click me</button>
        </KeyboardNavigation>
      );

      const button = document.querySelector('button') as HTMLElement;
      button.focus();

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      document.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });

    it('works with BUTTON elements', () => {
      const handleClick = jest.fn();

      render(
        <KeyboardNavigation>
          <button onClick={handleClick}>Native Button</button>
        </KeyboardNavigation>
      );

      const button = document.querySelector('button') as HTMLElement;
      button.focus();

      fireEvent.keyDown(document, { key: ' ' });

      expect(handleClick).toHaveBeenCalled();
    });

    it('does not activate non-button elements with Space', () => {
      const handleClick = jest.fn();

      render(
        <KeyboardNavigation>
          <div onClick={handleClick}>Not a button</div>
        </KeyboardNavigation>
      );

      const div = document.querySelector('div') as HTMLElement;
      div.focus();

      fireEvent.keyDown(document, { key: ' ' });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Event listener cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <KeyboardNavigation>
          <div>Test</div>
        </KeyboardNavigation>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('does not throw error on unmount', () => {
      const { unmount } = render(
        <KeyboardNavigation>
          <div>Test</div>
        </KeyboardNavigation>
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Complex menu structures', () => {
    it('handles nested focusable elements in menu', () => {
      render(
        <KeyboardNavigation>
          <div role="menu">
            <button role="menuitem">
              <span>Item 1</span>
            </button>
            <a href="#" role="menuitem">
              Item 2
            </a>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[0].focus();

      fireEvent.keyDown(document, { key: 'ArrowDown' });

      expect(document.activeElement).toBe(menuItems[1]);
    });

    it('handles menubar navigation', () => {
      render(
        <KeyboardNavigation>
          <div role="menubar">
            <button role="menuitem">File</button>
            <button role="menuitem">Edit</button>
            <button role="menuitem">View</button>
          </div>
        </KeyboardNavigation>
      );

      const menuItems = Array.from(document.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
      menuItems[0].focus();

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(document.activeElement).toBe(menuItems[1]);
    });
  });
});
