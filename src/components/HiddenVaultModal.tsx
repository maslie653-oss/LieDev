import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  FolderLock,
  Gamepad2,
  Trash2,
  Play,
  Download,
  Sparkles,
  Smartphone,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { StoredFileItem, AppItem, formatBytes } from '../utils/storageEngine';
import { GameKey } from './GamePlayerModal';

interface HiddenVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StoredFileItem[];
  apps: AppItem[];
  onToggleHideFile: (id: string, isHidden: boolean) => void;
  onToggleHideApp: (id: string, isHidden: boolean) => void;
  onPreviewFile: (file: StoredFileItem) => void;
  onPlayGame: (gameTitle: string, gameKey?: GameKey) => void;
  showToast: (msg: string) => void;
}

const VAULT_PIN_STORAGE_KEY = 'hyperclone_vault_pin_code';

export const HiddenVaultModal: React.FC<HiddenVaultModalProps> = ({
  isOpen,
  onClose,
  files,
  apps,
  onToggleHideFile,
  onToggleHideApp,
  onPreviewFile,
  onPlayGame,
  showToast,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'apps'>('files');
  const [showChangePin, setShowChangePin] = useState<boolean>(false);
  const [newPin, setNewPin] = useState<string>('');

  // Stored PIN or default 1234
  const getStoredPin = (): string => {
    return localStorage.getItem(VAULT_PIN_STORAGE_KEY) || '1234';
  };

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setErrorMessage(null);
      setIsUnlocked(false);
    }
  }, [isOpen]);

  const handleNumClick = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMessage(null);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const verifyPin = (candidatePin: string) => {
    const currentPin = getStoredPin();
    if (candidatePin === currentPin) {
      setIsUnlocked(true);
      setErrorMessage(null);
    } else {
      setErrorMessage('PIN Salah! Silakan coba lagi (Default PIN: 1234)');
      setPin('');
    }
  };

  const handleBiometricSimulate = () => {
    // Quick biometric / FaceID simulated unlock
    setIsUnlocked(true);
    showToast('Autentikasi Biometrik HyperScan Berhasil!');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      showToast('PIN baru harus terdiri dari 4 digit angka!');
      return;
    }
    localStorage.setItem(VAULT_PIN_STORAGE_KEY, newPin);
    setShowChangePin(false);
    setNewPin('');
    showToast('PIN Brankas Rahasia berhasil diperbarui!');
  };

  // Filter hidden items
  const hiddenFiles = files.filter((f) => f.isHidden);
  const hiddenApps = apps.filter((a) => a.isHidden);

  const totalHiddenBytes =
    hiddenFiles.reduce((sum, f) => sum + (f.size || 0), 0) +
    hiddenApps.reduce((sum, a) => sum + (a.size + (a.dataSize || 0)), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-purple-500/30 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-md">
              {isUnlocked ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Brankas Rahasia HyperVault</h3>
                <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                  AES-256 Terenkripsi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sembunyikan berkas penting, dokumen pribadi, foto, serta aplikasi dan game APK Anda
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isUnlocked && (
              <button
                onClick={() => setIsUnlocked(false)}
                title="Kunci Kembali Brankas"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center space-x-1"
              >
                <Lock className="h-3.5 w-3.5 text-purple-400" />
                <span>Kunci</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup Brankas"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* LOCKED STATE: PIN PAD */}
        {!isUnlocked ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <KeyRound className="h-8 w-8 animate-pulse" />
              </div>
              <h4 className="text-lg font-bold text-white mt-3">Masukkan PIN Keamanan</h4>
              <p className="text-xs text-slate-400">
                Ketik 4 digit PIN Anda untuk membuka brankas tersembunyi (PIN Standar:{' '}
                <span className="text-cyan-400 font-mono font-bold">1234</span>)
              </p>
            </div>

            {/* PIN Dots Display */}
            <div className="flex items-center space-x-4">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`h-4 w-4 rounded-full transition-all duration-200 ${
                    pin.length > idx
                      ? 'bg-purple-400 shadow-lg shadow-purple-500/50 scale-110'
                      : 'border-2 border-slate-700 bg-slate-900'
                  }`}
                />
              ))}
            </div>

            {errorMessage && (
              <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-semibold bg-rose-950/30 border border-rose-500/30 px-3 py-1.5 rounded-xl">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumClick(num)}
                  className="h-14 rounded-2xl border border-slate-800 bg-slate-950/90 text-lg font-bold text-white transition-all hover:border-purple-500/50 hover:bg-slate-800 active:scale-95 active:bg-purple-600"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBiometricSimulate}
                title="Buka Cepat dengan Biometrik"
                className="h-14 rounded-2xl border border-purple-500/20 bg-purple-950/30 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-900/40 active:scale-95 flex flex-col items-center justify-center"
              >
                <Sparkles className="h-4 w-4 mb-0.5 text-cyan-400" />
                <span>Bio/Face</span>
              </button>
              <button
                onClick={() => handleNumClick('0')}
                className="h-14 rounded-2xl border border-slate-800 bg-slate-950/90 text-lg font-bold text-white transition-all hover:border-purple-500/50 hover:bg-slate-800 active:scale-95 active:bg-purple-600"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-14 rounded-2xl border border-slate-800 bg-slate-950/90 text-xs font-semibold text-slate-400 transition-all hover:border-rose-500/40 hover:bg-slate-800 active:scale-95"
              >
                ⌫ Hapus
              </button>
            </div>
          </div>
        ) : (
          /* UNLOCKED STATE: VAULT CONTENT */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Top Vault Metrics Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                  <FolderLock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Status Brankas Terbuka</h4>
                  <p className="text-xs text-purple-300">
                    Menyimpan {hiddenFiles.length} berkas dan {hiddenApps.length} aplikasi tersembunyi (
                    {formatBytes(totalHiddenBytes)})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowChangePin(!showChangePin)}
                  className="rounded-xl border border-purple-500/30 bg-purple-900/30 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 transition-colors"
                >
                  Ganti PIN
                </button>
              </div>
            </div>

            {/* Change PIN Form */}
            {showChangePin && (
              <form
                onSubmit={handleChangePinSubmit}
                className="flex items-center space-x-2 rounded-2xl border border-slate-800 bg-slate-950 p-3"
              >
                <input
                  type="password"
                  maxLength={4}
                  placeholder="Masukkan 4 digit PIN baru..."
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-purple-500 hover:bg-purple-400 px-4 py-2 text-xs font-bold text-slate-950 transition-colors"
                >
                  Simpan PIN
                </button>
              </form>
            )}

            {/* Sub-tabs: Files vs Apps */}
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('files')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'files'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Berkas Tersembunyi ({hiddenFiles.length})
              </button>
              <button
                onClick={() => setActiveTab('apps')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'apps'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aplikasi & Game APK ({hiddenApps.length})
              </button>
            </div>

            {/* TAB: HIDDEN FILES */}
            {activeTab === 'files' && (
              <div className="space-y-3">
                {hiddenFiles.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
                    <EyeOff className="mx-auto h-8 w-8 text-slate-600" />
                    <h5 className="text-sm font-bold text-white">Belum Ada Berkas yang Disembunyikan</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Buka tab Penyimpanan, lalu klik ikon gembok "Sembunyikan" pada berkas apa pun untuk memasukkannya ke
                      brankas rahasia ini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hiddenFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 hover:border-purple-500/40 transition-all"
                      >
                        <div
                          onClick={() => onPreviewFile(file)}
                          className="flex items-center space-x-3 cursor-pointer overflow-hidden flex-1"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                            <Eye className="h-5 w-5" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white truncate">{file.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {formatBytes(file.size)} • {file.category}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 pl-2">
                          {/* Play Game Button if APK */}
                          {(file.category === 'apps' || file.name.endsWith('.apk')) && (
                            <button
                              onClick={() => onPlayGame(file.name, file.gameType || 'space_shooter')}
                              title="Mainkan Game Ini Sekarang"
                              className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-2 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                            >
                              <Gamepad2 className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onToggleHideFile(file.id, false);
                              showToast(`Berkas "${file.name}" dikembalikan ke daftar umum.`);
                            }}
                            title="Keluarkan dari Brankas (Unhide)"
                            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: HIDDEN APPS & GAMES */}
            {activeTab === 'apps' && (
              <div className="space-y-3">
                {hiddenApps.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-8 text-center space-y-2">
                    <Gamepad2 className="mx-auto h-8 w-8 text-slate-600" />
                    <h5 className="text-sm font-bold text-white">Belum Ada Game / Aplikasi Tersembunyi</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Kunci dan sembunyikan game favorit atau aplikasi perbankan Anda agar tidak terlihat di menu umum.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {hiddenApps.map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 hover:border-purple-500/40 transition-all"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden flex-1">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md">
                            <Gamepad2 className="h-5 w-5" />
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white truncate">{app.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{app.packageName}</div>
                            <div className="text-[10px] text-cyan-400 mt-0.5">
                              {formatBytes(app.size + (app.dataSize || 0))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 pl-2">
                          <button
                            onClick={() => onPlayGame(app.name, app.gameType || 'space_shooter')}
                            className="flex items-center space-x-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:brightness-110 active:scale-95 transition-all"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Main</span>
                          </button>

                          <button
                            onClick={() => {
                              onToggleHideApp(app.id, false);
                              showToast(`Aplikasi "${app.name}" dikembalikan ke daftar umum.`);
                            }}
                            title="Keluarkan dari Brankas (Unhide)"
                            className="rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950/70 px-6 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center space-x-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Disinkronkan otomatis dengan Akun Facebook Cloud Vault</span>
          </span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
