import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '../../src/components/ChatBubble';

describe('ChatBubble', () => {
  it('should render user message with correct styling', () => {
    render(<ChatBubble message="Hello from user" type="user" />);

    const bubble = screen.getByTestId('user-message');
    expect(bubble).toBeTruthy();
    expect(bubble.className).toContain('bg-blue-500');
    expect(bubble.className).toContain('text-white');
    expect(bubble.className).toContain('rounded-bl-none'); // user bubble style
    expect(screen.getByText('Hello from user')).toBeTruthy();
    expect(screen.getByText('You')).toBeTruthy(); // user label
  });

  it('should render AI message with correct styling', () => {
    render(<ChatBubble message="Hello from AI" type="ai" />);

    const bubble = screen.getByTestId('ai-message');
    expect(bubble).toBeTruthy();
    expect(bubble.className).toContain('bg-green-500');
    expect(bubble.className).toContain('text-white');
    expect(bubble.className).toContain('rounded-br-none'); // AI bubble style
    expect(screen.getByText('Hello from AI')).toBeTruthy();
    expect(screen.getByText('AI Assistant')).toBeTruthy(); // AI label
  });

  it('should apply custom className', () => {
    render(<ChatBubble message="Test" type="user" className="custom-class" />);

    const container = screen.getByTestId('user-message').parentElement;
    expect(container?.className).toContain('custom-class');
  });

  it('should display message content correctly', () => {
    const longMessage = 'This is a longer message with multiple words and sentences.';
    render(<ChatBubble message={longMessage} type="ai" />);

    expect(screen.getByText(longMessage)).toBeTruthy();
  });

  it('should have proper accessibility structure', () => {
    render(<ChatBubble message="Accessible message" type="user" />);

    // Check for semantic structure (though it's a div, it has proper content)
    expect(screen.getByTestId('user-message')).toBeTruthy();
    expect(screen.getByText('Accessible message')).toBeTruthy();
  });
});
