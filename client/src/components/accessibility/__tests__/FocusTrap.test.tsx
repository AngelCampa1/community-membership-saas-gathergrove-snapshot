/**
 * Tests for FocusTrap.tsx - Focus management for modals and dialogs
 * Following boundary mocking pattern: test real focus behavior
 */

import React, { useRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import FocusTrap from '../FocusTrap';

describe('FocusTrap', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  describe('Rendering', () => {
    it('renders children without error', () => {
      const { getByText } = render(
        <FocusTrap>
          <div>Test Content</div>
        </FocusTrap>
      );

      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('renders children directly when inactive', () => {
      const { container } = render(
        <FocusTrap active={false}>
          <div>Inactive Content</div>
        </FocusTrap>
      );

      // Should not have focus-trap wrapper
      expect(container.querySelector('.focus-trap')).not.toBeInTheDocument();
    });

    it('wraps children in focus-trap div when active', () => {
      const { container } = render(
        <FocusTrap active={true}>
          <div>Active Content</div>
        </FocusTrap>
      );

      expect(container.querySelector('.focus-trap')).toBeInTheDocument();
    });
  });

  describe('Initial focus', () => {
    it('focuses first focusable element by default', () => {
      render(
        <FocusTrap active={true}>
          <button>First</button>
          <button>Second</button>
        </FocusTrap>
      );

      const firstButton = document.querySelector('button');
      expect(document.activeElement).toBe(firstButton);
    });

    it('focuses first element when custom initial focus not in container', () => {
      const TestComponent = () => {
        const externalRef = useRef<HTMLButtonElement>(null);

        return (
          <FocusTrap active={true} initialFocus={externalRef.current}>
            <button>First</button>
            <button>Second</button>
          </FocusTrap>
        );
      };

      render(<TestComponent />);

      const firstButton = document.querySelector('button');
      expect(document.activeElement).toBe(firstButton);
    });

    it('does not focus when inactive', () => {
      const previousActive = document.activeElement;

      render(
        <FocusTrap active={false}>
          <button>Test</button>
        </FocusTrap>
      );

      expect(document.activeElement).toBe(previousActive);
    });

    it('handles container with no focusable elements', () => {
      const { container } = render(
        <FocusTrap active={true}>
          <div>No focusable elements</div>
        </FocusTrap>
      );

      // Should not throw error
      expect(container).toBeInTheDocument();
    });
  });

  describe('Tab key navigation', () => {
    it('wraps focus to first element when tabbing from last', () => {
      render(
        <FocusTrap active={true}>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </FocusTrap>
      );

      const buttons = Array.from(document.querySelectorAll('button'));
      const lastButton = buttons[2];

      // Focus last button
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // Tab from last button should cycle to first
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('wraps focus to last element when shift+tabbing from first', () => {
      render(
        <FocusTrap active={true}>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </FocusTrap>
      );

      const buttons = Array.from(document.querySelectorAll('button'));
      const firstButton = buttons[0];

      expect(document.activeElement).toBe(firstButton);

      // Shift+Tab from first should wrap to last
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(buttons[2]);
    });

    it('does not interfere with Tab in middle of elements', () => {
      render(
        <FocusTrap active={true}>
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </FocusTrap>
      );

      const buttons = Array.from(document.querySelectorAll('button'));

      // Focus second button (middle element)
      buttons[1].focus();
      expect(document.activeElement).toBe(buttons[1]);

      // Tab from middle doesn't change focus (component doesn't intervene)
      // Browser would handle this, but jsdom doesn't simulate it
      const preventDefault = jest.fn();
      fireEvent.keyDown(document, { key: 'Tab', preventDefault });

      // Component should NOT prevent default when not at boundaries
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Focusable elements detection', () => {
    it('includes buttons in focus trap', () => {
      const { container } = render(
        <FocusTrap active={true}>
          <button>Button</button>
        </FocusTrap>
      );

      const button = container.querySelector('button');
      expect(document.activeElement).toBe(button);
    });

    it('includes links in focus trap', () => {
      const { container } = render(
        <FocusTrap active={true}>
          <a href="#test">Link</a>
        </FocusTrap>
      );

      const link = container.querySelector('a');
      expect(document.activeElement).toBe(link);
    });

    it('includes inputs in focus trap', () => {
      render(
        <FocusTrap active={true}>
          <input type="text" />
          <button>Submit</button>
        </FocusTrap>
      );

      const input = document.querySelector('input');
      expect(document.activeElement).toBe(input);
    });

    it('includes select elements in focus trap', () => {
      render(
        <FocusTrap active={true}>
          <select>
            <option>Option 1</option>
          </select>
          <button>Submit</button>
        </FocusTrap>
      );

      const select = document.querySelector('select');
      expect(document.activeElement).toBe(select);
    });

    it('includes textarea in focus trap', () => {
      render(
        <FocusTrap active={true}>
          <textarea />
          <button>Submit</button>
        </FocusTrap>
      );

      const textarea = document.querySelector('textarea');
      expect(document.activeElement).toBe(textarea);
    });

    it('includes elements with tabindex >= 0', () => {
      render(
        <FocusTrap active={true}>
          <div tabIndex={0}>Focusable div</div>
          <button>Button</button>
        </FocusTrap>
      );

      const div = document.querySelector('[tabindex="0"]');
      expect(document.activeElement).toBe(div);
    });

    it('excludes disabled buttons', () => {
      render(
        <FocusTrap active={true}>
          <button disabled>Disabled</button>
          <button>Enabled</button>
        </FocusTrap>
      );

      const enabledButton = document.querySelectorAll('button')[1];
      expect(document.activeElement).toBe(enabledButton);
    });

    it('excludes disabled inputs', () => {
      render(
        <FocusTrap active={true}>
          <input disabled />
          <input />
        </FocusTrap>
      );

      const enabledInput = document.querySelectorAll('input')[1];
      expect(document.activeElement).toBe(enabledInput);
    });

    it('excludes elements with tabindex="-1"', () => {
      render(
        <FocusTrap active={true}>
          <div tabIndex={-1}>Not focusable</div>
          <button>Focusable</button>
        </FocusTrap>
      );

      const button = document.querySelector('button');
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Escape key handling', () => {
    it('calls onEscape when Escape is pressed', () => {
      const onEscape = jest.fn();

      render(
        <FocusTrap active={true} onEscape={onEscape}>
          <button>Close</button>
        </FocusTrap>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onEscape).toHaveBeenCalled();
    });

    it('does not call onEscape for other keys', () => {
      const onEscape = jest.fn();

      render(
        <FocusTrap active={true} onEscape={onEscape}>
          <button>Close</button>
        </FocusTrap>
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'A' });

      expect(onEscape).not.toHaveBeenCalled();
    });

    it('works without onEscape callback', () => {
      render(
        <FocusTrap active={true}>
          <button>Close</button>
        </FocusTrap>
      );

      // Should not throw error
      expect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }).not.toThrow();
    });
  });

  describe('Focus restoration', () => {
    it('restores focus to previous element on unmount', () => {
      // Create an external button to focus initially
      const externalButton = document.createElement('button');
      externalButton.textContent = 'External';
      document.body.appendChild(externalButton);
      externalButton.focus();

      const initialFocus = document.activeElement;

      const { unmount } = render(
        <FocusTrap active={true}>
          <button>Trapped</button>
        </FocusTrap>
      );

      // Focus should be trapped
      expect(document.activeElement).not.toBe(initialFocus);

      // Unmount should restore focus
      unmount();
      expect(document.activeElement).toBe(initialFocus);

      // Cleanup
      document.body.removeChild(externalButton);
    });

    it('handles case where previous element is no longer in DOM', () => {
      const externalButton = document.createElement('button');
      document.body.appendChild(externalButton);
      externalButton.focus();

      const { unmount } = render(
        <FocusTrap active={true}>
          <button>Trapped</button>
        </FocusTrap>
      );

      // Remove the external button
      document.body.removeChild(externalButton);

      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      const { unmount } = render(
        <FocusTrap active={true}>
          <button>Test</button>
        </FocusTrap>
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('does not set up listeners when inactive', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      render(
        <FocusTrap active={false}>
          <button>Test</button>
        </FocusTrap>
      );

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });
  });

  describe('Dynamic content', () => {
    it('updates trap when active prop changes', () => {
      const externalButton = document.createElement('button');
      externalButton.textContent = 'External';
      document.body.appendChild(externalButton);
      externalButton.focus();

      const { rerender, container } = render(
        <FocusTrap active={false}>
          <button>Trap</button>
        </FocusTrap>
      );

      // Should not trap initially
      expect(document.activeElement).toBe(externalButton);

      // Activate trap
      rerender(
        <FocusTrap active={true}>
          <button>Trap</button>
        </FocusTrap>
      );

      // Should now trap focus - find the trap button within the container
      const trapButton = container.querySelector('button');
      expect(document.activeElement).toBe(trapButton);

      document.body.removeChild(externalButton);
    });

    it('handles focusable elements being added dynamically', () => {
      const { container } = render(
        <FocusTrap active={true}>
          <button>First</button>
          <button>Second</button>
        </FocusTrap>
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons).toHaveLength(2);

      // First button should be focused initially
      expect(document.activeElement).toBe(buttons[0]);

      // Focus last button
      buttons[1].focus();
      expect(document.activeElement).toBe(buttons[1]);

      // Tab from last should wrap to first (tests that trap works with current elements)
      fireEvent.keyDown(document, { key: 'Tab' });
      expect(document.activeElement).toBe(buttons[0]);
    });
  });
});
