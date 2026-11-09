import React, { useState } from 'react';
import {
  Users,
  MessageSquare,
  Layers,
  History,
  Search,
  Plus,
  Trash2,
  Download,
  Send,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Phone,
  Mail,
  Gamepad2,
  Play,
  Lock,
  Unlock,
} from 'lucide-react';
import { ContactItem, MessageItem, AppItem, formatBytes } from '../utils/storageEngine';
import { CloneSessionLog } from '../utils/indexedDb';
import { GameKey } from './GamePlayerModal';

interface PhoneDataViewerProps {
  contacts: ContactItem[];
  messages: MessageItem[];
  apps: AppItem[];
  history: CloneSessionLog[];
  onAddContact: (contact: ContactItem) => void;
  onDeleteContact: (id: string) => void;
  onSendMessage: (threadId: string, text: string) => void;
  onPlayGame?: (gameTitle: string, gameKey?: GameKey) => void;
  onToggleHideApp?: (id: string, isHidden: boolean) => void;
  onOpenGoogleSync?: () => void;
}

export const PhoneDataViewer: React.FC<PhoneDataViewerProps> = ({
  contacts,
  messages,
  apps,
  history,
  onAddContact,
  onDeleteContact,
  onSendMessage,
  onPlayGame,
  onToggleHideApp,
  onOpenGoogleSync,
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'messages' | 'apps' | 'history'>('contacts');

  // Contacts state
  const [contactSearch, setContactSearch] = useState('');
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactGroup, setNewContactGroup] = useState('Keluarga');

  // Messages state
  const [messageSearch, setMessageSearch] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string>(messages[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  // Apps state
  const [appSearch, setAppSearch] = useState('');

  // Filtered contacts
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone.includes(contactSearch)
  );

  // Filtered messages
  const filteredMessages = messages.filter(
    (m) =>
      m.sender.toLowerCase().includes(messageSearch.toLowerCase()) ||
      m.preview.toLowerCase().includes(messageSearch.toLowerCase())
  );

  const activeThread = messages.find((m) => m.id === selectedThreadId) || messages[0];

  // Filtered apps (exclude hidden apps from public list)
  const filteredApps = apps.filter((a) =>
    !a.isHidden && a.name.toLowerCase().includes(appSearch.toLowerCase())
  );

  // Export Contacts to real .vcf file
  const handleExportVCard = () => {
    let vcfContent = '';
    contacts.forEach((c) => {
      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;TYPE=CELL:${c.phone}\n${
        c.email ? `EMAIL:${c.email}\n` : ''
      }END:VCARD\n\n`;
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kontak_HyperClone_${contacts.length}_Item.vcf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: ContactItem = {
      id: `c_${Date.now()}`,
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      email: newContactEmail.trim() || undefined,
      group: newContactGroup,
      avatarColor: 'from-cyan-500 to-blue-600',
    };

    onAddContact(newContact);
    setNewContactName('');
    setNewContactPhone('');
    setNewContactEmail('');
    setShowAddContactModal(false);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;
    onSendMessage(activeThread.id, replyText.trim());
    setReplyText('');
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-7 shadow-xl">
      {/* Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Manajer Konten Ponsel Terkloning</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Jelajahi dan kelola kontak, pesan SMS, aplikasi, dan histori migrasi dari ponsel Anda
          </p>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80 p-1.5 text-xs font-semibold scrollbar-none">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 transition-all ${
              activeTab === 'contacts'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Kontak ({contacts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 transition-all ${
              activeTab === 'messages'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Pesan ({messages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('apps')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 transition-all ${
              activeTab === 'apps'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Aplikasi ({apps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 transition-all ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Riwayat Kloning</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="pt-5">
        {/* TAB 1: KONTAK (CONTACTS) */}
        {activeTab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari kontak berdasarkan nama atau nomor..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-2">
                {onOpenGoogleSync && (
                  <button
                    onClick={onOpenGoogleSync}
                    aria-label="Sinkronkan dengan Google Contacts"
                    className="flex items-center space-x-1.5 rounded-xl border border-blue-500/30 bg-blue-950/30 hover:bg-blue-900/40 px-3.5 py-2 text-xs font-semibold text-blue-300 transition-all active:scale-95"
                  >
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    <span>Sinkron Google</span>
                  </button>
                )}
                <button
                  onClick={handleExportVCard}
                  aria-label="Ekspor Kontak ke format vCard"
                  className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all active:scale-95"
                >
                  <Download className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Ekspor vCard (.vcf)</span>
                </button>
                <button
                  onClick={() => setShowAddContactModal(true)}
                  aria-label="Tambah Kontak Baru"
                  className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Kontak</span>
                </button>
              </div>
            </div>

            {/* Contacts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="group flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 transition-all hover:border-cyan-500/40 hover:bg-slate-850"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${
                        contact.avatarColor || 'from-cyan-500 to-blue-600'
                      } text-sm font-bold text-white shadow-md`}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-white truncate">{contact.name}</span>
                        {contact.group && (
                          <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[9px] text-slate-400">
                            {contact.group}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-[11px] text-cyan-400/90 mt-0.5 font-mono">
                        <Phone className="mr-1 h-3 w-3 text-slate-500" />
                        <span>{contact.phone}</span>
                      </div>
                      {contact.email && (
                        <div className="flex items-center text-[10px] text-slate-500 truncate">
                          <Mail className="mr-1 h-2.5 w-2.5 text-slate-600" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteContact(contact.id)}
                    aria-label={`Hapus kontak ${contact.name}`}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/30 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Modal: Tambah Kontak */}
            {showAddContactModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
                <form
                  onSubmit={handleCreateContact}
                  className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4"
                >
                  <h4 className="text-base font-bold text-white">Tambah Kontak Baru</h4>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Raden Mas Bagus"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Nomor Telepon</label>
                    <input
                      type="tel"
                      required
                      placeholder="+62 812-xxxx-xxxx"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Email (Opsional)</label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">Grup</label>
                    <select
                      value={newContactGroup}
                      onChange={(e) => setNewContactGroup(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Keluarga">Keluarga</option>
                      <option value="Kantor">Kantor</option>
                      <option value="Teman">Teman</option>
                      <option value="Bisnis">Bisnis</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(false)}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 shadow-md"
                    >
                      Simpan Kontak
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PESAN & SMS (MESSAGES) */}
        {activeTab === 'messages' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[440px] rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            {/* Conversation list */}
            <div className="border-r border-slate-800/80 flex flex-col h-full bg-slate-900/40">
              <div className="p-3 border-b border-slate-800">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari pesan..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                {filteredMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedThreadId(msg.id)}
                    className={`cursor-pointer p-3 transition-colors ${
                      selectedThreadId === msg.id
                        ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">{msg.sender}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{msg.preview}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Chat Viewer */}
            <div className="col-span-2 flex flex-col h-full bg-slate-950/90">
              {activeThread ? (
                <>
                  {/* Chat header */}
                  <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-slate-900/50">
                    <div>
                      <div className="text-xs font-bold text-white">{activeThread.sender}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{activeThread.senderPhone}</div>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
                      Tersinkronisasi
                    </span>
                  </div>

                  {/* Messages Bubble Stream */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeThread.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${m.fromMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                            m.fromMe
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                              : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/60'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1">
                          {new Date(m.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Reply bar */}
                  <form onSubmit={handleSendReply} className="border-t border-slate-800 p-2.5 flex items-center space-x-2 bg-slate-900/60">
                    <input
                      type="text"
                      placeholder="Ketik balasan pesan..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      aria-label="Kirim balasan SMS"
                      className="rounded-xl bg-cyan-500 p-2 text-slate-950 hover:bg-cyan-400 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                  Pilih percakapan untuk membaca pesan
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: APLIKASI TERKLONING (APPS) */}
        {activeTab === 'apps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari aplikasi..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="text-xs text-slate-400">
                Total Penyimpanan Aplikasi: <span className="font-bold text-white">58.4 GB</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {filteredApps.map((app) => (
                <div
                  key={app.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-slate-700 hover:bg-slate-850 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
                        {app.isGame || app.category.includes('Game') ? (
                          <Gamepad2 className="h-6 w-6 text-emerald-400" />
                        ) : (
                          <Layers className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {onToggleHideApp && (
                          <button
                            onClick={() => onToggleHideApp(app.id, true)}
                            title="Sembunyikan ke Brankas Rahasia"
                            className="rounded-lg p-1 text-slate-500 hover:bg-purple-950/40 hover:text-purple-300 transition-colors"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold text-cyan-400">
                          v{app.version}
                        </span>
                      </div>
                    </div>

                    <h4 className="mt-3 text-xs font-bold text-white truncate">{app.name}</h4>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{app.packageName}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">APK: {formatBytes(app.size)}</span>
                      <span className="text-cyan-400 font-semibold">Data: {formatBytes(app.dataSize)}</span>
                    </div>

                    {(app.isGame || app.category.includes('Game')) && onPlayGame && (
                      <button
                        onClick={() => onPlayGame(app.name, app.gameType || 'space_shooter')}
                        className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-1.5 text-xs font-bold text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition-all"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        <span>Mainkan Game</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RIWAYAT KLONING (HISTORY) */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-8 text-center">
                <Clock className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                <h4 className="text-sm font-bold text-white">Belum Ada Sesi Kloning Tercatat</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Jalankan asisten kloning ponsel dengan mengklik tombol "Kloning HP Baru" di pojok kanan atas!
                </p>
              </div>
            ) : (
              history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {h.sourceDevice} ➔ {h.targetDevice}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(h.timestamp).toLocaleString('id-ID')} • {h.itemsCloned.toLocaleString()} item disalin
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white font-mono">{formatBytes(h.totalTransferredBytes)}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">Kecepatan: {h.averageSpeedMbs} MB/s</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
