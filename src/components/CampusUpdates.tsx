import React, { useState } from 'react';
import { 
  Inbox, 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Sparkles, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  Plus
} from 'lucide-react';
import { AppState, CampusUpdate } from '../types.js';

interface CampusUpdatesProps {
  state: AppState;
  onRefresh: () => void;
  setActiveTab: (tab: string) => void;
}

export const CampusUpdates: React.FC<CampusUpdatesProps> = ({ state, onRefresh, setActiveTab }) => {
  const { campusUpdates } = state;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showWhatsAppImporter, setShowWhatsAppImporter] = useState(false);
  const [whatsAppRawText, setWhatsAppRawText] = useState('');
  const [isParsingWhatsApp, setIsParsingWhatsApp] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  // Manual Notice Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');
  const [newNoticeCategory, setNewNoticeCategory] = useState<any>('Exams');
  const [newNoticeDeadline, setNewNoticeDeadline] = useState('');
  const [newNoticeSource, setNewNoticeSource] = useState<any>('College Notice');

  const categories = ['All', 'Exams', 'Assignments', 'Internships', 'Workshops', 'Scholarships', 'Events', 'General Notices'];

  // Filter updates
  const filteredUpdates = campusUpdates.filter((u) => {
    const matchesCategory = selectedCategory === 'All' || u.category === selectedCategory;
    const matchesSearch =
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Convert Announcement to Task
  const handleConvertToTask = async (updateId: string) => {
    try {
      const res = await fetch('/api/campus-updates/convert-to-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateId }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error('Failed to convert to task', e);
    }
  };

  // Mark Update As Read
  const handleToggleRead = async (id: string, currentRead: boolean) => {
    try {
      await fetch(`/api/campus-updates/${id}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !currentRead }),
      });
      onRefresh();
    } catch (e) {
      console.error('Failed to mark read', e);
    }
  };

  // Parse WhatsApp exported TXT
  const handleParseWhatsApp = async () => {
    if (!whatsAppRawText.trim()) return;
    setIsParsingWhatsApp(true);
    setParseStatus(null);

    try {
      const res = await fetch('/api/campus-updates/parse-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: whatsAppRawText }),
      });
      const data = await res.json();
      setIsParsingWhatsApp(false);
      setParseStatus(`Extracted ${data.count} academic notices from WhatsApp chat!`);
      setWhatsAppRawText('');
      onRefresh();
    } catch (e) {
      console.error('Failed to parse WhatsApp text', e);
      setIsParsingWhatsApp(false);
      setParseStatus('Failed to parse text. Please check the format.');
    }
  };

  // Add Manual Notice
  const handleAddManualNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) return;

    try {
      await fetch('/api/campus-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newNoticeTitle.trim(),
          source: newNoticeSource,
          date: new Date().toISOString().split('T')[0],
          deadline: newNoticeDeadline || undefined,
          category: newNoticeCategory,
          content: newNoticeContent.trim(),
          actionRequired: Boolean(newNoticeDeadline),
          verifiedDate: true,
          important: true,
        }),
      });
      setShowManualModal(false);
      setNewNoticeTitle('');
      setNewNoticeContent('');
      setNewNoticeDeadline('');
      onRefresh();
    } catch (e) {
      console.error('Failed to add notice', e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
              <Inbox className="w-4 h-4 text-cyan-400" />
              <span>Unified College Communications Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Campus Updates Inbox
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Aggregating announcements from Gmail, Google Classroom, WhatsApp chats, and Official Bulletins with deduplication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowWhatsAppImporter(!showWhatsAppImporter)}
              className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 flex items-center space-x-2 transition cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Import WhatsApp Chat TXT</span>
            </button>

            <button
              onClick={() => setShowManualModal(true)}
              className="px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add College Notice</span>
            </button>
          </div>
        </div>

        {/* Integration Status Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Google Classroom</span>
            <p className="text-emerald-400 font-bold mt-0.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Sync Active</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Gmail Alerts</span>
            <p className="text-emerald-400 font-bold mt-0.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Connected</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">WhatsApp Parser</span>
            <p className="text-cyan-400 font-bold mt-0.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>TXT Export Importer</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">College Notice Board</span>
            <p className="text-emerald-400 font-bold mt-0.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Daily Monitored</span>
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Deduplication</span>
            <p className="text-indigo-400 font-bold mt-0.5 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Smart Cross-Source</span>
            </p>
          </div>
        </div>
      </div>

      {/* WHATSAPP CHAT TXT IMPORTER COLLAPSIBLE */}
      {showWhatsAppImporter && (
        <div className="rounded-2xl bg-slate-900 border-2 border-emerald-500/30 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Import Exported WhatsApp Class Group Chat</h2>
            </div>
            <button
              onClick={() => setShowWhatsAppImporter(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Export chat without media from your college WhatsApp group, copy the text, and paste it below. CampusMate AI will automatically filter academic deadlines, assignments, exam halls, and workshops while filtering out chatter.
          </p>

          <textarea
            rows={5}
            value={whatsAppRawText}
            onChange={(e) => setWhatsAppRawText(e.target.value)}
            placeholder={`Example WhatsApp format:\n[12/10/26, 10:30 AM] Prof. Sharma: Dear students, DBMS Assignment 3 is due this Friday 5 PM.\n[12/10/26, 11:15 AM] CR Vikram: Guys please note, attendance above 75% is mandatory for hall tickets.\n[12/10/26, 02:00 PM] Dean: Mid-Semester exams will commence from October 18.`}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold">{parseStatus}</span>
            <button
              onClick={handleParseWhatsApp}
              disabled={isParsingWhatsApp || !whatsAppRawText.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg transition"
            >
              {isParsingWhatsApp ? 'Parsing Messages...' : 'Extract Announcements & Deadlines'}
            </button>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex overflow-x-auto space-x-2 pb-2 sm:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notices, exams, or labs..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* UPDATES FEED GRID */}
      <div className="space-y-4">
        {filteredUpdates.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            No campus announcements found matching your criteria.
          </div>
        ) : (
          filteredUpdates.map((update) => {
            const isUnread = !update.read;
            const hasDuplicate = (update.duplicateCount || 0) > 0 || update.isDuplicateOf;

            return (
              <div
                key={update.id}
                className={`rounded-2xl border p-5 transition flex flex-col justify-between shadow-lg ${
                  isUnread
                    ? 'bg-slate-900/90 border-slate-700/90'
                    : 'bg-slate-900/50 border-slate-800/80 opacity-75'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-cyan-300 border border-slate-700">
                        {update.source}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">{update.category}</span>
                      <span className="text-[10px] text-slate-500">• {update.date}</span>

                      {/* Duplicate Grouping Indicator */}
                      {hasDuplicate && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center space-x-1">
                          <Layers className="w-2.5 h-2.5" />
                          <span>Matched across sources</span>
                        </span>
                      )}
                    </div>

                    {update.deadline && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        Due: {update.deadline}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 leading-snug">
                    {update.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {update.content}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleRead(update.id, update.read)}
                      className="text-slate-400 hover:text-slate-200 transition"
                    >
                      {update.read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {update.actionRequired && (
                      <button
                        onClick={() => handleConvertToTask(update.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center space-x-1.5 transition shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Convert to Task & Reminder</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD NOTICE MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add College Announcement</h3>
            <form onSubmit={handleAddManualNotice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  placeholder="e.g. Mid-Sem Exam Hall Ticket Release"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Source</label>
                <select
                  value={newNoticeSource}
                  onChange={(e) => setNewNoticeSource(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="College Notice">College Notice Board</option>
                  <option value="Google Classroom">Google Classroom</option>
                  <option value="Gmail">Gmail / Email</option>
                  <option value="WhatsApp">WhatsApp Group</option>
                  <option value="Social Media">College Social Media / IEEE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Category</label>
                  <select
                    value={newNoticeCategory}
                    onChange={(e) => setNewNoticeCategory(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Exams">Exams</option>
                    <option value="Assignments">Assignments</option>
                    <option value="Internships">Internships</option>
                    <option value="Workshops">Workshops</option>
                    <option value="Scholarships">Scholarships</option>
                    <option value="Events">Events</option>
                    <option value="General Notices">General Notices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Deadline (Optional)</label>
                  <input
                    type="date"
                    value={newNoticeDeadline}
                    onChange={(e) => setNewNoticeDeadline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Notice Content</label>
                <textarea
                  rows={3}
                  required
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  placeholder="Details of the announcement..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
