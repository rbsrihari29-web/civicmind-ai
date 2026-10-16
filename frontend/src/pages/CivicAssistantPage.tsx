import React, { useState } from 'react';
import { Bot, Send, Sparkles, BookOpen, ExternalLink, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { CitationSource } from '../types';

interface Message {
  sender: 'user' | 'assistant';
  content: string;
  citations?: CitationSource[];
  groundingConfidence?: string;
  suggestedFollowUps?: string[];
}

export const CivicAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      content: 
        "Vanakkam! I am the CivicMind AI Assistant, your evidence-grounded civic advisor for Greater Chennai Corporation and Tamil Nadu municipalities.\n\n" +
        "I provide accurate, cited procedural advice based strictly on verified statutory documents—including the GCC Citizen Charter, Solid Waste Management Bylaws, and Monsoon Standard Operating Procedures.\n\n" +
        "How can I assist you with your civic questions or grievance escalations today?",
      suggestedFollowUps: [
        "What is the statutory repair SLA for potholes in Chennai?",
        "How are waterlogging complaints handled during monsoons?",
        "What are the penalties for open garbage dumping?",
        "Who is the escalation officer if my complaint is ignored?"
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<CitationSource | null>(null);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { sender: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await api.askAssistant(query);
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: res.response,
        citations: res.citations,
        groundingConfidence: res.grounding_confidence,
        suggestedFollowUps: res.suggested_follow_ups
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        content: `Error connecting to Civic Knowledge Engine: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Civic AI Assistant</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Statutory Grounded</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500">Cites official GCC Citizen Charters, SWM Bylaws, and Works Manuals.</p>
          </div>
        </div>
      </div>

      {/* Main Chat & Citation Pane */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden pt-4">
        {/* Messages Feed */}
        <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`space-y-2.5 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-4 rounded-2xl max-w-[90%] text-left text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80'
                }`}>
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Grounded Citations Drawer Trigger */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-blue-600" />
                        <span>Supporting Statutory Citations ({msg.citations.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setActiveCitation(c)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[10px] font-semibold flex items-center space-x-1 transition-colors"
                          >
                            <span>Doc: {c.document_title.slice(0, 28)}...</span>
                            <ChevronRight className="w-2.5 h-2.5 text-blue-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Follow-up suggestions */}
                {msg.suggestedFollowUps && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedFollowUps.map((s, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSend(s)}
                        className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="text-left">
                <div className="inline-block p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs animate-pulse flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                  <span>Searching vector knowledge base & retrieving official SLAs...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any question regarding civic bylaws, repair SLAs, or grievance escalations..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 disabled:opacity-50 flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Column: Citation Inspector Drawer */}
        <div className="hidden lg:flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-y-auto">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Citation Evidence Inspector</span>
          </h3>

          {activeCitation ? (
            <div className="space-y-4 pt-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Document Title</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{activeCitation.document_title}</div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Issuing Authority</span>
                <div className="font-semibold text-slate-700 mt-0.5">{activeCitation.organization}</div>
              </div>

              {activeCitation.section && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Charter Section</span>
                  <div className="font-semibold text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 mt-0.5">
                    {activeCitation.section}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Retrieved Statutory Passage</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-serif mt-1">
                  "{activeCitation.excerpt}"
                </div>
              </div>

              {activeCitation.source_url && (
                <div className="pt-2">
                  <a
                    href={activeCitation.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center space-x-1 text-xs font-semibold"
                  >
                    <span>View Official Government Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-slate-600">No Citation Selected</p>
              <p className="text-[11px]">Click on any citation pill inside the chat messages to inspect the verified municipal text.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
