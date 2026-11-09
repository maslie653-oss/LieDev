import {
  Smartphone,
  HardDrive,
  Wifi,
  BatteryCharging,
  Cpu,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Download,
  Trash2,
  Lock,
} from 'lucide-react';
import { DeviceProfile } from '../utils/storageEngine';
import { User } from 'firebase/auth';

interface HeaderProps {
  profile: DeviceProfile;
  totalUsedFormatted: string;
  totalCapacityFormatted: string;
  usedPercentage: number;
  currentUser?: User | null;
  facebookUser?: any | null;
  onOpenCloneWizard: () => void;
  onOpenCleaner: () => void;
  onOpenBackupRestore: () => void;
  onOpenGoogleSync?: () => void;
  onOpenFacebookLogin: () => void;
  onOpenVault: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  totalUsedFormatted,
  totalCapacityFormatted,
  usedPercentage,
  currentUser,
  facebookUser,
  onOpenCloneWizard,
  onOpenCleaner,
  onOpenBackupRestore,
  onOpenGoogleSync,
  onOpenFacebookLogin,
  onOpenVault,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-500/20 bg-slate-950/85 backdrop-blur-md">
      {/* Top Device Hardware Status Strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 px-4 py-1.5 text-xs text-slate-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-cyan-400 font-medium">
              <Smartphone className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
              {profile.deviceName}
            </span>
            <span className="hidden md:inline-block text-slate-600">•</span>
            <span className="hidden md:flex items-center text-slate-400">
              <Cpu className="mr-1 h-3.5 w-3.5 text-slate-500" />
              {profile.cpuModel} | {profile.ramGb}GB RAM
            </span>
            <span className="hidden sm:inline-block text-slate-600">•</span>
            <span className="hidden sm:inline-flex items-center text-emerald-400">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-emerald-400" />
              Enkripsi AES-256 Aktif
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center text-cyan-400/90 font-mono">
              <Wifi className="mr-1.5 h-3.5 w-3.5 animate-pulse text-cyan-400" />
              <span>{profile.connectionSpeed}</span>
            </div>
            <div className="flex items-center text-emerald-400 font-medium">
              <BatteryCharging className="mr-1 h-3.5 w-3.5 text-emerald-400 animate-bounce" />
              <span>{profile.batteryLevel}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
            <Smartphone className="h-6 w-6 text-white" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-slate-950">
              5T
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                Hyper<span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">Clone</span>
              </h1>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-950/60 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300">
                5 TB Ultra-Vault
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Kloning Ponsel Cepat & Brankas Penyimpanan Terabyte
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          {/* Quick Storage Meter Pill */}
          <div
            onClick={onOpenCleaner}
            className="hidden lg:flex cursor-pointer items-center space-x-2.5 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5 transition-all hover:border-cyan-500/40 hover:bg-slate-850"
            title="Klik untuk optimasi penyimpanan"
          >
            <HardDrive className="h-4 w-4 text-cyan-400" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Penyimpanan Terpakai</div>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-white">
                <span>{totalUsedFormatted}</span>
                <span className="text-slate-500">/</span>
                <span className="text-cyan-400">{totalCapacityFormatted}</span>
                <span className="text-[11px] text-slate-400">({usedPercentage}%)</span>
              </div>
            </div>
          </div>

          {/* Backup & Restore button */}
          <button
            onClick={onOpenBackupRestore}
            aria-label="Cadangkan dan Pulihkan Data"
            className="flex items-center space-x-1.5 rounded-xl border border-slate-700/80 bg-slate-850 px-3 py-2 text-xs font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden md:inline">Cadangkan</span>
          </button>

          {/* Storage Cleaner button */}
          <button
            onClick={onOpenCleaner}
            aria-label="Bersihkan Ruang Penyimpanan"
            className="flex items-center space-x-1.5 rounded-xl border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-xs font-medium text-amber-300 transition-all hover:bg-amber-900/40 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Bersihkan</span>
          </button>

          {/* Facebook Exclusive Anti-Reset Cloud Vault Login Button */}
          <button
            onClick={onOpenFacebookLogin}
            aria-label="Login Akun Facebook Anti Reset HP"
            className={`flex items-center space-x-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-md active:scale-95 transition-all ${
              facebookUser
                ? 'border-blue-500/50 bg-blue-950/40 text-blue-300 hover:bg-blue-900/50'
                : 'border-[#1877F2]/60 bg-[#1877F2] text-white hover:bg-[#166fe5] shadow-blue-500/20'
            }`}
          >
            {facebookUser?.avatarUrl ? (
              <img
                src={facebookUser.avatarUrl}
                alt="Facebook User"
                className="h-3.5 w-3.5 rounded-full ring-1 ring-white/50 object-cover"
              />
            ) : (
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[#1877F2] font-black text-[10px]">
                f
              </span>
            )}
            <span className="hidden sm:inline">
              {facebookUser ? (facebookUser.name?.split(' ')[0] || 'Facebook') : 'Masuk Facebook'}
            </span>
            <span className="hidden xl:inline text-[10px] opacity-80">
              {facebookUser ? '(Aman Reset HP)' : '(Anti-Reset HP)'}
            </span>
          </button>

          {/* Secret Vault (Brankas Rahasia) PIN Button */}
          <button
            onClick={onOpenVault}
            aria-label="Buka Brankas Rahasia Terenkripsi"
            className="flex items-center space-x-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 px-3 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-900/50 hover:border-purple-400/60 active:scale-95 shadow-md shadow-purple-950/30"
          >
            <Lock className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Brankas Rahasia</span>
            <span className="hidden xl:inline text-[10px] text-purple-400 font-mono">(PIN)</span>
          </button>

          {/* Primary Action: Launch Phone Clone Wizard */}
          <button
            onClick={onOpenCloneWizard}
            aria-label="Mulai Kloning Ponsel"
            className="group relative flex items-center space-x-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:brightness-110 active:scale-95"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
            <RefreshCw className="h-4 w-4 animate-spin-slow transition-transform group-hover:rotate-180" />
            <span className="tracking-wide">Kloning HP Baru</span>
            <Sparkles className="h-3.5 w-3.5 text-cyan-200" />
          </button>
        </div>
      </div>
    </header>
  );
};
