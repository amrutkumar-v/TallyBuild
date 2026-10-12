import { useRef, useState, useCallback } from 'react';
import {
  Bot,
  Copy,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from 'lucide-react';

import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

import styles from './FloatingAIAssistant.module.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE = `Hi! I'm your TallyBuild AI assistant. I can help you:

• Clarify project requirements and scope
• Explain estimation results and assumptions
• Suggest cost categories for your project
• Guide you through the New Estimate workflow
• Answer questions about the workspace

What would you like to know?`;

const SUGGESTED_PROMPTS = [
  'How do I create a new estimate?',
  'What does "Complexity: High" mean?',
  'Explain the cost breakdown',
  'How to compare scenarios?',
  'What currencies are supported?',
];

function generateResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes('create') || msg.includes('new estimate') || msg.includes('start')) {
    return `To create a new estimate:

1. Click **"New Estimate"** in the sidebar or the CTA on the Dashboard
2. Fill in **Project details** (name, scope, category, complexity)
3. Add **cost lines** — Personnel, Tooling, Infrastructure, Other
4. Choose your **currency** (INR, USD, EUR, AED)
5. Click **Calculate estimate** to get a total from the estimation service

The service totals your cost lines transparently — no hidden math.`;
  }

  if (msg.includes('complexity') || msg.includes('category')) {
    return `**Categories:**
• **New Product** — Building something from scratch
• **Feature** — Adding capability to existing product
• **Platform** — Infrastructure or platform work
• **Integration** — Connecting systems/services
• **Maintenance** — Ongoing support/bug fixes

**Complexity levels:**
• **Low** — Well-understood, standard approach
• **Medium** — Some unknowns, moderate risk
• **High** — Significant unknowns, research needed

These affect how the estimation engine applies buffers and assumptions.`;
  }

  if (msg.includes('cost') || msg.includes('breakdown') || msg.includes('total')) {
    return `The estimate total comes from four cost sections:

1. **Personnel** — People × Hours × Hourly rate
2. **Tooling** — One-off licence/tool costs
3. **Infrastructure** — Monthly cost × Months
4. **Other** — Contingency, travel, training, etc.

Each line is calculated separately, then summed. The result shows subtotals per section plus assumptions the engine applied (e.g., rounding rules, default buffers).`;
  }

  if (msg.includes('compare') || msg.includes('scenario') || msg.includes('what-if')) {
    return `**Scenario Comparison** (Phase 03) — will let you place two estimates side by side to compare totals, categories, duration and complexity.

**What-if Analysis** (Phase 03) — will let you adjust inputs (team size, rates, duration) and see how the total changes, with baseline vs. scenario comparison.

For now, you can manually compare estimates on the **Comparison** page by selecting two from your workspace.`;
  }

  if (msg.includes('currency') || msg.includes('currencies')) {
    return `Supported currencies: **INR, USD, EUR, AED**.

Each estimate uses one currency. The estimation engine rounds to the correct decimal places per currency (INR: 0, USD/EUR/AED: 2). Live conversion is not configured — all amounts are entered in the chosen currency.`;
  }

  if (msg.includes('help') || msg.includes('what can you')) {
    return `I can help with:

• **Workflow guidance** — How to create, save, calculate estimates
• **Field explanations** — What each input means
• **Results interpretation** — Reading the cost breakdown
• **Feature status** — What's available now vs. Phase 03
• **Technical details** — Currency handling, rounding, assumptions

Just ask!`;
  }

  return `I'm still learning the workspace. For now I can explain:

• How to create and calculate estimates
• What the cost categories mean
• How complexity affects estimates
• Currency support and rounding
• Phase 03 features (comparison, what-if)

Try asking: *"How do I create an estimate?"* or *"Explain the cost breakdown."`; 
}

let messageIdCounter = 0;

function generateId(prefix: string): string {
  messageIdCounter += 1;
  return `${prefix}-${messageIdCounter}`;
}

function WelcomeMessage() {
  return (
    <div key="welcome" className={styles.message}>
      <div className={styles.messageAvatar}>
        <Bot size={14} aria-hidden="true" />
      </div>
      <div className={styles.messageContent}>
        <div className={styles.messageText}>{WELCOME_MESSAGE}</div>
      </div>
    </div>
  );
}

function MessageItem({ msg, formatTime, copyToClipboard }: { msg: Message; formatTime: (date: Date) => string; copyToClipboard: (text: string) => void }) {
  return (
    <div key={msg.id} className={cn(styles.message, msg.role === 'user' ? styles.userMessage : styles.assistantMessage)}>
      <div className={styles.messageAvatar}>
        {msg.role === 'user' ? <MessageSquare size={14} aria-hidden="true" /> : <Bot size={14} aria-hidden="true" />}
      </div>
      <div className={styles.messageContent}>
        <div className={styles.messageText}>{msg.content}</div>
        <div className={styles.messageMeta}>
          <time>{formatTime(msg.timestamp)}</time>
          {msg.role === 'assistant' && (
            <Button
              variant="ghost"
              size="sm"
              iconStart={<Copy size={10} aria-hidden="true" />}
              onClick={() => copyToClipboard(msg.content)}
              className={styles.copyButton}
              aria-label="Copy response"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingMessage() {
  return (
    <div className={cn(styles.message, styles.assistantMessage, styles.loadingMessage)}>
      <div className={styles.messageAvatar}>
        <Bot size={14} aria-hidden="true" />
      </div>
      <div className={styles.messageContent}>
        <div className={styles.loadingDots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>
    </div>
  );
}

function Suggestions({ onSuggestionClick }: { onSuggestionClick: (prompt: string) => void }) {
  return (
    <div className={styles.suggestions} role="group" aria-label="Suggested prompts">
      <span className={styles.suggestionsLabel}>Try asking:</span>
      <div className={styles.suggestionsList}>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" className={styles.suggestionChip} onClick={() => onSuggestionClick(prompt)}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}



export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId('user'),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const currentInput = input.trim();
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setShowSuggestions(false);
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

    const response = generateResponse(currentInput);
    setMessages((prev) => [...prev, {
      id: generateId('assistant'),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    }]);
    setIsLoading(false);
  }, [input, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((prompt: string) => {
    setInput(prompt);
    void handleSend();
  }, [handleSend]);

  const copyToClipboardFn = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const formatTimeFn = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  return (
    <>
      <button
        type="button"
        className={cn(styles.fab, isOpen && styles.fabOpen)}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="ai-assistant-panel"
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
      >
        {isOpen ? <X size={22} aria-hidden="true" /> : <Bot size={22} aria-hidden="true" />}
        <span className={styles.fabLabel}>AI Assistant</span>
        {!isOpen && <span className={styles.notificationDot} aria-hidden="true" />}
      </button>

      {isOpen && (
        <div id="ai-assistant-panel" className={styles.panel} role="dialog" aria-label="AI Assistant">
          <div className={styles.panelHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.avatar}>
                <Sparkles size={16} aria-hidden="true" />
              </div>
              <div>
                <h3 className={styles.title}>TallyBuild AI</h3>
                <p className={styles.subtitle}>Estimation assistant</p>
              </div>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.messages} role="log" aria-live="polite">
            {messages.length === 0 ? (
              <WelcomeMessage />
            ) : (
              messages.map((msg) => <MessageItem key={msg.id} msg={msg} formatTime={formatTimeFn} copyToClipboard={copyToClipboardFn} />)
            )}
            {isLoading && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && messages.length <= 1 && (
            <Suggestions onSuggestionClick={handleSuggestionClick} />
          )}

          <div className={styles.inputArea}>
            <textarea
              id="ai-assistant-input"
              className={styles.input}
              placeholder={isLoading ? 'Thinking…' : 'Ask about estimates, workflows, features…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={isLoading}
              aria-label="Message"
            />
            <Button
              type="button"
              variant="primary"
              iconStart={<Send size={16} aria-hidden="true" />}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={styles.sendButton}
              aria-label="Send message"
            />
          </div>

          <p className={styles.disclaimer}>
            AI responses are generated locally for this demo. No data is sent to external services.
          </p>
        </div>
      )}
    </>
  );
}