import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  ArrowRight,
  Wifi,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Sparkles,
  Zap,
  Play,
  Pause,
  AlertCircle,
  FileCheck,
  Share2,
} from 'lucide-react';
import { formatBytes } from '../utils/storageEngine';
import { fireCelebrationConfetti } from '../utils/confetti';

interface CloneWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCloneSuccess: (sessionSummary: {
    itemsCount: number;
    totalBytes: number;
    categories: string[];
  }) => void;
}

type StepType = 'role_selection' | 'pairing' | 'category_selection' | 'transferring' | 'completed';

interface MigrationCategory {
  id: string;
  name: string;
  count: number;
  unit: string;
  sizeBytes: number;
  checked: boolean;
  description: string;
}

const INITIAL_CATEGORIES: MigrationCategory[] = [
  { id: 'contacts', name: 'Kontak & Buku Telepon', count: 412, unit: 'kontak', sizeBytes: 2.8 * 1024 * 1024, checked: true, description: 'Nama, nomor telepon, email, avatar, dan vCard' },
  { id: 'messages', name: 'Pesan & SMS / MMS', count: 2130, unit: 'pesan', sizeBytes: 28.5 * 1024 * 1024, checked: true, description: 'Riwayat obrolan lengkap dan lampiran media' },
  { id: 'calls', name: 'Log & Riwayat Panggilan', count: 340, unit: 'panggilan', sizeBytes: 1.4 * 1024 * 1024, checked: true, description: 'Panggilan masuk, keluar, dan tidak terjawab' },
  { id: 'photos', name: 'Foto & Album Galeri', count: 3410, unit: 'foto', sizeBytes: 14.8 * 1024 * 1024 * 1024, checked: true, description: 'Foto kamera, tangkapan layar, gambar WhatsApp' },
  { id: 'videos', name: 'Video 4K / HD', count: 142, unit: 'video', sizeBytes: 42.1 * 1024 * 1024 * 1024, checked: true, description: 'Video rekaman 4K60, status, dan klip tersimpan' },
  { id: 'audio', name: 'Musik & Rekaman Suara', count: 580, unit: 'audio', sizeBytes: 4.2 * 1024 * 1024 * 1024, checked: true, description: 'Lagu FLAC/MP3, memo suara, dan nada dering' },
  { id: 'documents', name: 'Dokumen & Unduhan', count: 890, unit: 'dokumen', sizeBytes: 3.1 * 1024 * 1024 * 1024, checked: true, description: 'Berkas PDF, Word, Excel, ZIP, dan e-book' },
  { id: 'apps', name: 'Aplikasi & Data Akun', count: 48, unit: 'aplikasi', sizeBytes: 18.4 * 1024 * 1024 * 1024, checked: true, description: 'APK terpasang, basis data WhatsApp, dan pengaturan' },
  { id: 'settings', name: 'Pengaturan Sistem & Wi-Fi', count: 32, unit: 'pengaturan', sizeBytes: 12 * 1024 * 1024, checked: true, description: 'Sandi Wi-Fi tersimpan, Bluetooth, wallpaper & alarm' },
];

export const CloneWizardModal: React.FC<CloneWizardModalProps> = ({ isOpen, onClose, onCloneSuccess }) => {
  const [currentStep, setCurrentStep] = useState<StepType>('role_selection');
  const [phoneRole, setPhoneRole] = useState<'sender' | 'receiver' | 'simulation'>('simulation');
  const [pairingMethod, setPairingMethod] = useState<'qr' | 'code' | 'radar'>('radar');
  const [pairingCode] = useState('842-917');
  const [connectedDevice, setConnectedDevice] = useState<string>('Galaxy S24 Ultra (Ponsel Lama)');

  // Categories selection
  const [categories, setCategories] = useState<MigrationCategory[]>(INITIAL_CATEGORIES);

  // Transfer simulation state
  const [progress, setProgress] = useState(0);
  const [speedMbs, setSpeedMbs] = useState(94.2);
  const [transferredBytes, setTransferredBytes] = useState(0);
  const [currentTransferFile, setCurrentTransferFile] = useState('Menyiapkan saluran enkripsi Wi-Fi 7 Direct...');
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const transferIntervalRef = useRef<any>(null);

  const totalSelectedBytes = categories
    .filter((c) => c.checked)
    .reduce((sum, c) => sum + c.sizeBytes, 0);

  const totalSelectedItems = categories
    .filter((c) => c.checked)
    .reduce((sum, c) => sum + c.count, 0);

  // Reset modal state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('role_selection');
      setProgress(0);
      setTransferredBytes(0);
      setIsPaused(false);
      setElapsedSeconds(0);
      setCategories(INITIAL_CATEGORIES);
    }
  }, [isOpen]);

  // Clean interval on unmount
  useEffect(() => {
    return () => {
      if (transferIntervalRef.current) clearInterval(transferIntervalRef.current);
    };
  }, []);

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setCategories((prev) => prev.map((c) => ({ ...c, checked: select })));
  };

  // Start the live transfer simulation
  const startLiveTransfer = () => {
    setCurrentStep('transferring');
    setProgress(0);
    setTransferredBytes(0);
    setElapsedSeconds(0);
    setIsPaused(false);

    const fileSampleList = [
      'Menyinkronkan 412 Kontak vCard terenkripsi...',
      'Mengunduh Basis Data Obrolan WhatsApp & Riwayat Pesan...',
      'Mengirim DCIM/Camera/IMG_20261106_142319.jpg (24.5 MB)...',
      'Mengirim DCIM/Camera/IMG_20261105_LabuanBajo.jpg (19.8 MB)...',
      'Mengirim DCIM/Camera/VID_20261102_Cinematic_4K60.mp4 (850 MB)...',
      'Mengirim Koleksi Album Musik Hi-Res Studio Master (480 MB)...',
      'Mengirim Dokumen Proyek Master_Portfolio_2026.pdf (88 MB)...',
      'Menginstal Paket APK Mobile Legends & Data Game (12.8 GB)...',
      'Menyalin Sandi Jaringan Wi-Fi & Pasangan Perangkat Bluetooth...',
      'Memverifikasi integritas checksum SHA-256 seluruh berkas...',
    ];

    let currentByteCount = 0;
    const targetBytes = totalSelectedBytes > 0 ? totalSelectedBytes : 82 * 1024 * 1024 * 1024;
    let tickerIndex = 0;

    transferIntervalRef.current = setInterval(() => {
      if (isPaused) return;

      setElapsedSeconds((sec) => sec + 1);

      // Randomize speed between 82 MB/s and 124 MB/s
      const currentSpeed = 85 + Math.random() * 38;
      setSpeedMbs(Number(currentSpeed.toFixed(1)));

      // In real-time simulation, let progress advance smoothly over ~12-15 seconds
      currentByteCount += (targetBytes / 14);
      if (currentByteCount >= targetBytes) {
        currentByteCount = targetBytes;
        clearInterval(transferIntervalRef.current);
        setProgress(100);
        setTransferredBytes(targetBytes);
        setCurrentTransferFile('Verifikasi integritas data 100% cocok!');
        setTimeout(() => {
          setCurrentStep('completed');
          fireCelebrationConfetti();
          onCloneSuccess({
            itemsCount: totalSelectedItems,
            totalBytes: targetBytes,
            categories: categories.filter((c) => c.checked).map((c) => c.name),
          });
        }, 1200);
      } else {
        const percent = Math.min(99, Math.round((currentByteCount / targetBytes) * 100));
        setProgress(percent);
        setTransferredBytes(currentByteCount);

        const newIndex = Math.min(
          fileSampleList.length - 1,
          Math.floor((percent / 100) * fileSampleList.length)
        );
        if (newIndex !== tickerIndex) {
          tickerIndex = newIndex;
          setCurrentTransferFile(fileSampleList[newIndex]);
        }
      }
    }, 1000);
  };

  const handlePauseResume = () => {
    setIsPaused((p) => !p);
  };

  const handleCancelTransfer = () => {
    if (transferIntervalRef.current) clearInterval(transferIntervalRef.current);
    setCurrentStep('category_selection');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-900 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <RefreshCw className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">Asisten Kloning Ponsel Super Cepat</h3>
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                  Wi-Fi 7 Direct • 1.2 Gbps
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pindahkan seluruh data, aplikasi, dan foto ke HP baru Anda dengan kapasitas 5 TB
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup jendela kloning ponsel"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Multi-step Wizard */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: ROLE SELECTION */}
          {currentStep === 'role_selection' && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto">
                <h4 className="text-xl font-bold text-white">Tentukan Peran Perangkat Ini</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Pilih apakah ponsel ini akan mengirim data lama atau menerima seluruh data di perangkat baru
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {/* Option 1: Sender (Ponsel Lama) */}
                <div
                  onClick={() => {
                    setPhoneRole('sender');
                    setConnectedDevice('HyperPhone 16 Pro Max (Ponsel Baru 5 TB)');
                    setCurrentStep('pairing');
                  }}
                  className="group cursor-pointer rounded-2xl border border-slate-700/80 bg-slate-850/70 p-5 transition-all hover:border-cyan-400 hover:bg-slate-800 hover:shadow-xl hover:shadow-cyan-500/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <h5 className="mt-4 text-base font-bold text-white">Ini Ponsel Lama</h5>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Kirim semua kontak, foto, pesan, dan berkas dari perangkat ini ke ponsel baru.
                  </p>
                  <div className="mt-4 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Mulai Kirim</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Option 2: Receiver (Ponsel Baru) */}
                <div
                  onClick={() => {
                    setPhoneRole('receiver');
                    setConnectedDevice('Galaxy S24 Ultra (Ponsel Lama Pengirim)');
                    setCurrentStep('pairing');
                  }}
                  className="group cursor-pointer rounded-2xl border border-slate-700/80 bg-slate-850/70 p-5 transition-all hover:border-blue-400 hover:bg-slate-800 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <HardDrive className="h-6 w-6" />
                  </div>
                  <h5 className="mt-4 text-base font-bold text-white">Ini Ponsel Baru</h5>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Terima dan simpan seluruh kloningan data ke brankas penyimpanan 5 TB ponsel ini.
                  </p>
                  <div className="mt-4 flex items-center text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform">
                    <span>Buka Penerima</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Option 3: Dual-Device Simulation (Recommended Instant Demo) */}
                <div
                  onClick={() => {
                    setPhoneRole('simulation');
                    setConnectedDevice('Ponsel Lama (Sumber) ➔ Ponsel Baru (5 TB)');
                    setCurrentStep('pairing');
                  }}
                  className="group relative cursor-pointer rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-b from-cyan-950/30 to-slate-850 p-5 transition-all hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20"
                >
                  <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider shadow">
                    Direkomendasikan
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/30">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h5 className="mt-4 text-base font-bold text-white">Simulasi Cepat 2 HP</h5>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Lihat langsung proses kloning interaktif antar dua ponsel dengan kecepatan penuh 100+ MB/s!
                  </p>
                  <div className="mt-4 flex items-center text-xs font-semibold text-cyan-300 group-hover:translate-x-1 transition-transform">
                    <span>Coba Sekarang</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </div>
              </div>

              {/* Protocol info */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Koneksi aman point-to-point tanpa kuota internet atau perantara server eksternal.</span>
                </div>
                <div className="flex items-center space-x-1.5 text-cyan-400">
                  <Wifi className="h-4 w-4" />
                  <span>Hotspot Wi-Fi 7 Direct Otomatis</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PAIRING */}
          {currentStep === 'pairing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-lg font-bold text-white">Menghubungkan Perangkat</h4>
                  <p className="text-xs text-slate-400">
                    Pindai kode QR atau pilih perangkat dari radar Wi-Fi Direct
                  </p>
                </div>
                <div className="flex rounded-xl bg-slate-800 p-1 text-xs font-medium">
                  <button
                    onClick={() => setPairingMethod('radar')}
                    className={`rounded-lg px-3 py-1 transition-colors ${pairingMethod === 'radar' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Radar Otomatis
                  </button>
                  <button
                    onClick={() => setPairingMethod('qr')}
                    className={`rounded-lg px-3 py-1 transition-colors ${pairingMethod === 'qr' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Kode QR
                  </button>
                  <button
                    onClick={() => setPairingMethod('code')}
                    className={`rounded-lg px-3 py-1 transition-colors ${pairingMethod === 'code' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Kode PIN
                  </button>
                </div>
              </div>

              {/* Radar View */}
              {pairingMethod === 'radar' && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative flex h-48 w-48 items-center justify-center">
                    {/* Animated radar rings */}
                    <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping duration-1000" />
                    <div className="absolute inset-4 rounded-full border border-cyan-500/40" />
                    <div className="absolute inset-12 rounded-full border border-cyan-500/60 bg-cyan-950/20" />
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/40 z-10">
                      <Wifi className="h-8 w-8 animate-pulse" />
                    </div>
                  </div>

                  <div className="mt-4 max-w-sm">
                    <div className="inline-flex items-center space-x-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Perangkat Ditemukan: {connectedDevice}</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Jalur transmisi P2P aman terdeteksi dengan sinyal 100% dan latensi 0.8ms.
                    </p>
                  </div>
                </div>
              )}

              {/* QR Code View */}
              {pairingMethod === 'qr' && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="relative rounded-2xl border-2 border-cyan-500/40 bg-white p-4 shadow-xl">
                    <div className="relative h-44 w-44 flex items-center justify-center bg-slate-100 rounded-xl overflow-hidden">
                      <QrCode className="h-36 w-36 text-slate-900" />
                      {/* Laser scanning line animation */}
                      <div className="absolute left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_10px_#00f2fe] animate-pulse top-1/2" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    Arahkan kamera ponsel lain ke kode QR ini untuk menghubungkan secara instan.
                  </p>
                </div>
              )}

              {/* PIN Code View */}
              {pairingMethod === 'code' && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                    Kode Pemasangan Cepat
                  </div>
                  <div className="flex items-center space-x-3 text-3xl font-mono font-black text-cyan-400 bg-slate-950 px-6 py-3 rounded-2xl border border-cyan-500/40 shadow-inner">
                    <span>{pairingCode}</span>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Masukkan kode 6 digit ini di ponsel tujuan Anda.
                  </p>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep('role_selection')}
                  aria-label="Kembali ke pemilihan peran"
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setCurrentStep('category_selection')}
                  aria-label="Konfirmasi sambungan dan pilih data kloning"
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
                >
                  <span>Hubungkan & Pilih Data</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: CATEGORY SELECTION */}
          {currentStep === 'category_selection' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-lg font-bold text-white">Pilih Data yang Akan Dikloning</h4>
                  <p className="text-xs text-slate-400">
                    Pilih kategori yang ingin dipindahkan ke penyimpanan 5 TB ponsel baru
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-200 transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-slate-400 transition-colors"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>

              {/* Total Chosen Summary Strip */}
              <div className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-4 py-3 text-xs">
                <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                  <span>
                    {categories.filter((c) => c.checked).length} Kategori Terpilih • {totalSelectedItems.toLocaleString()} Item
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-normal">Ukuran Total: </span>
                  <span className="font-extrabold text-white text-sm">{formatBytes(totalSelectedBytes)}</span>
                </div>
              </div>

              {/* Categories Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {categories.map((cat) => (
                  <label
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`cursor-pointer flex items-start space-x-3 rounded-2xl border p-3.5 transition-all ${
                      cat.checked
                        ? 'border-cyan-500/50 bg-slate-850 shadow-md shadow-cyan-500/5'
                        : 'border-slate-800 bg-slate-900/60 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={cat.checked}
                      onChange={() => {}}
                      className="mt-1 h-4 w-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{cat.name}</span>
                        <span className="text-xs font-semibold text-cyan-400">
                          {formatBytes(cat.sizeBytes)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{cat.description}</p>
                      <div className="mt-1 text-[10px] font-medium text-slate-500">
                        {cat.count.toLocaleString()} {cat.unit}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setCurrentStep('pairing')}
                  aria-label="Kembali ke pemasangan perangkat"
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Kembali
                </button>
                <button
                  onClick={startLiveTransfer}
                  disabled={totalSelectedBytes === 0}
                  aria-label="Mulai transfer migrasi sekarang"
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-2.5 text-xs font-bold text-white shadow-xl shadow-cyan-500/30 transition-all disabled:opacity-50 active:scale-95"
                >
                  <Zap className="h-4 w-4" />
                  <span>Mulai Kloning ({formatBytes(totalSelectedBytes)})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LIVE HIGH-SPEED TRANSFERRING */}
          {currentStep === 'transferring' && (
            <div className="space-y-6 py-2">
              <div className="text-center">
                <span className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Sedang Melakukan Kloning Berkecepatan Tinggi</span>
                </span>
                <h4 className="mt-2 text-2xl font-black text-white">
                  Migrasi Data Sedang Berlangsung
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Harap letakkan kedua ponsel saling berdekatan. Jangan matikan Wi-Fi atau menutup aplikasi.
                </p>
              </div>

              {/* Dual Phone Interactive Beam Visualizer */}
              <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden">
                {/* Background particle grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#00f2fe_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

                {/* Left Phone: Sender */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/40 bg-slate-900 text-cyan-400 shadow-lg shadow-cyan-500/20">
                    <Smartphone className="h-8 w-8" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-white">Ponsel Lama</div>
                  <div className="text-[10px] text-slate-400">Pengirim (Sumber)</div>
                </div>

                {/* Connecting Particle Beam */}
                <div className="relative z-10 flex-1 w-full flex flex-col items-center justify-center px-4">
                  <div className="text-xs font-mono font-bold text-cyan-400 mb-1 flex items-center space-x-2">
                    <Zap className="h-3.5 w-3.5 animate-bounce" />
                    <span>{speedMbs} MB/s</span>
                  </div>
                  <div className="relative w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${progress}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 shadow-[0_0_12px_#00f2fe] transition-all duration-300"
                    />
                  </div>
                  <div className="flex justify-between w-full text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span>{formatBytes(transferredBytes)}</span>
                    <span className="font-bold text-white">{progress}%</span>
                    <span>{formatBytes(totalSelectedBytes)}</span>
                  </div>
                </div>

                {/* Right Phone: Receiver (5TB Mega Vault) */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-slate-900 text-emerald-400 shadow-lg shadow-emerald-500/20">
                    <HardDrive className="h-8 w-8" />
                  </div>
                  <div className="mt-2 text-xs font-bold text-white">Ponsel Baru (5 TB)</div>
                  <div className="text-[10px] text-emerald-400">Penyimpanan Terpasang</div>
                </div>
              </div>

              {/* Real-time file ticker */}
              <div className="rounded-xl border border-slate-800 bg-slate-850/80 px-4 py-3 flex items-center space-x-3">
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Sedang Ditransfer</div>
                  <div className="text-xs font-mono text-slate-200 truncate">{currentTransferFile}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Waktu Berjalan</div>
                  <div className="text-xs font-mono font-semibold text-cyan-400">{elapsedSeconds} detik</div>
                </div>
              </div>

              {/* Pause & Cancel Controls */}
              <div className="flex items-center justify-center space-x-4 pt-2">
                <button
                  onClick={handlePauseResume}
                  aria-label={isPaused ? "Lanjutkan proses transfer" : "Jeda proses transfer"}
                  className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition-all active:scale-95"
                >
                  {isPaused ? <Play className="h-4 w-4 text-emerald-400" /> : <Pause className="h-4 w-4 text-amber-400" />}
                  <span>{isPaused ? 'Lanjutkan' : 'Jeda Transfer'}</span>
                </button>
                <button
                  onClick={handleCancelTransfer}
                  aria-label="Batalkan proses transfer"
                  className="flex items-center space-x-2 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/30 px-4 py-2 text-xs font-semibold text-rose-300 transition-all active:scale-95"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Batalkan</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: COMPLETED REPORT */}
          {currentStep === 'completed' && (
            <div className="space-y-6 py-4 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="h-10 w-10 animate-bounce" />
              </div>

              <div>
                <h4 className="text-2xl font-black text-white">Kloning Berhasil 100%!</h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                  Semua data ponsel lama Anda telah berhasil disalin secara utuh ke penyimpanan 5 TB ponsel baru dengan integritas checksum valid.
                </p>
              </div>

              {/* Migration Stats Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-left">
                <div className="rounded-2xl border border-slate-800 bg-slate-850 p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Data</div>
                  <div className="text-base font-bold text-white mt-0.5">{formatBytes(totalSelectedBytes)}</div>
                  <div className="text-[10px] text-emerald-400">Tersalin Utuh</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-850 p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Jumlah Item</div>
                  <div className="text-base font-bold text-white mt-0.5">{totalSelectedItems.toLocaleString()}</div>
                  <div className="text-[10px] text-cyan-400">{categories.filter(c => c.checked).length} Kategori</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-850 p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Kecepatan Rata2</div>
                  <div className="text-base font-bold text-white mt-0.5">102.5 MB/s</div>
                  <div className="text-[10px] text-slate-400">Wi-Fi 7 Direct</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-850 p-3.5">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Integritas Data</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">100% Cocok</div>
                  <div className="text-[10px] text-slate-400">SHA-256 Valid</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={onClose}
                  aria-label="Buka Brankas Penyimpanan 5 TB"
                  className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
                >
                  <HardDrive className="h-4 w-4" />
                  <span>Buka Brankas Penyimpanan 5 TB</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
