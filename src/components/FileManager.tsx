import React, { useState, useRef } from 'react';
import {
  Search,
  UploadCloud,
  File,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Layers,
  HardDrive,
  Trash2,
  Eye,
  Download,
  Edit2,
  Grid,
  List,
  Filter,
  Plus,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { StoredFileItem, formatBytes } from '../utils/storageEngine';

interface FileManagerProps {
  files: StoredFileItem[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  onUploadFiles: (files: FileList) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onPreviewFile: (file: StoredFileItem) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  selectedCategory,
  onSelectCategory,
  onUploadFiles,
  onDeleteFile,
  onRenameFile,
  onPreviewFile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'name'>('date');
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter files by category & search query
  const filteredFiles = files.filter((f) => {
    const matchesCategory =
      selectedCategory === 'all' ||
      selectedCategory === 'free' ||
      f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort files
  filteredFiles.sort((a, b) => {
    if (sortBy === 'date') return (b.createdAt || 0) - (a.createdAt || 0);
    if (sortBy === 'size') return b.size - a.size;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
    }
  };

  const startRename = (file: StoredFileItem) => {
    setEditingFileId(file.id);
    setEditingFileName(file.name);
  };

  const commitRename = (id: string) => {
    if (editingFileName.trim()) {
      onRenameFile(id, editingFileName.trim());
    }
    setEditingFileId(null);
  };

  // Helper to trigger download of file
  const handleDownload = (file: StoredFileItem) => {
    if (file.blobData) {
      const link = document.createElement('a');
      link.href = file.blobData;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      // Create mock blob for sample file
      const blob = new Blob([`Simulasi konten berkas cadangan HP untuk ${file.name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  };

  const getFileCategoryIcon = (category: string) => {
    switch (category) {
      case 'photos':
        return <ImageIcon className="h-5 w-5 text-cyan-400" />;
      case 'videos':
        return <Film className="h-5 w-5 text-purple-400" />;
      case 'audio':
        return <Music className="h-5 w-5 text-amber-400" />;
      case 'documents':
        return <FileText className="h-5 w-5 text-emerald-400" />;
      case 'apps':
        return <Layers className="h-5 w-5 text-rose-400" />;
      default:
        return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      {/* Drag & Drop Upload Banner */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
            : 'border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 hover:bg-slate-900/90'
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-white">
            Tarik & Lepas Berkas ke Sini atau <span className="text-cyan-400 underline">Pilih Berkas</span>
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Dukung foto resolusi tinggi, video 4K, dokumen, atau backup sistem. Disimpan langsung ke brankas 5 TB Anda.
          </p>
        </div>
      </div>

      {/* Filter Tabs, Search Bar, and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
          {[
            { id: 'all', label: 'Semua Berkas' },
            { id: 'photos', label: 'Foto' },
            { id: 'videos', label: 'Video' },
            { id: 'audio', label: 'Audio' },
            { id: 'documents', label: 'Dokumen' },
            { id: 'apps', label: 'Aplikasi' },
            { id: 'system', label: 'Sistem' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Layout Toggle */}
        <div className="flex items-center space-x-2">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari berkas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="date">Terbaru</option>
            <option value="size">Ukuran</option>
            <option value="name">Nama (A-Z)</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl border border-slate-800 bg-slate-900/80 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              aria-label="Tampilan Kisi"
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              aria-label="Tampilan Daftar"
              className={`rounded-lg p-1.5 transition-colors ${
                viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display: Empty State or Grid/List */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
            <File className="h-7 w-7" />
          </div>
          <h4 className="mt-4 text-base font-bold text-white">Tidak Ada Berkas Ditemukan</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada berkas yang cocok dengan pencarian "${searchQuery}".`
              : 'Belum ada berkas dalam kategori ini. Unggah berkas baru atau jalankan kloning ponsel!'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center space-x-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-4 py-2 text-xs font-semibold text-cyan-300 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Unggah Berkas Baru</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-slate-850 hover:shadow-xl hover:shadow-cyan-500/5"
            >
              {/* Badges: duplicate, cache */}
              {file.isDuplicate && (
                <span className="absolute top-2.5 right-2.5 flex items-center space-x-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[9px] font-semibold text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Duplikat</span>
                </span>
              )}
              {file.isCache && (
                <span className="absolute top-2.5 right-2.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[9px] font-semibold text-rose-400">
                  Cache Sampah
                </span>
              )}

              {/* Thumbnail / Icon Container */}
              <div
                onClick={() => onPreviewFile(file)}
                className="cursor-pointer relative flex h-32 w-full items-center justify-center rounded-xl bg-slate-950/80 overflow-hidden mb-3 border border-slate-800/80 group-hover:border-slate-700"
              >
                {file.category === 'photos' && file.blobData ? (
                  <img
                    src={file.blobData}
                    alt={file.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    {getFileCategoryIcon(file.category)}
                    <span className="mt-2 text-[10px] uppercase font-mono font-bold text-slate-500">
                      {file.type.split('/')[1] || file.category}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="rounded-xl bg-cyan-500/80 p-2 text-slate-950 shadow-md">
                    <Eye className="h-4 w-4" />
                  </span>
                </div>
              </div>

              {/* File Info */}
              <div>
                {editingFileId === file.id ? (
                  <div className="flex items-center space-x-1 mb-1">
                    <input
                      type="text"
                      value={editingFileName}
                      onChange={(e) => setEditingFileName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && commitRename(file.id)}
                      autoFocus
                      className="w-full rounded border border-cyan-500 bg-slate-950 px-2 py-0.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      onClick={() => commitRename(file.id)}
                      className="rounded bg-cyan-500 p-1 text-slate-950 hover:bg-cyan-400"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <h4
                    onClick={() => onPreviewFile(file)}
                    title={file.name}
                    className="cursor-pointer text-xs font-bold text-white hover:text-cyan-400 truncate"
                  >
                    {file.name}
                  </h4>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{formatBytes(file.size)}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-slate-400">
                <button
                  onClick={() => onPreviewFile(file)}
                  title="Lihat Pratinjau"
                  className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  title="Unduh Berkas"
                  className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => startRename(file)}
                  title="Ganti Nama"
                  className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-amber-300 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onDeleteFile(file.id)}
                  title="Hapus Berkas"
                  className="rounded-lg p-1.5 hover:bg-rose-950/30 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Nama Berkas</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Ukuran</th>
                  <th className="px-4 py-3">Tanggal Dibuat</th>
                  <th className="px-4 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        {getFileCategoryIcon(file.category)}
                        <span
                          onClick={() => onPreviewFile(file)}
                          className="cursor-pointer font-medium text-white hover:text-cyan-400 truncate max-w-xs"
                        >
                          {file.name}
                        </span>
                        {file.isDuplicate && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300">
                            Duplikat
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-slate-400">{file.category}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-white">
                      {formatBytes(file.size)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(file.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onPreviewFile(file)}
                          className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-cyan-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownload(file)}
                          className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-cyan-300"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => startRename(file)}
                          className="rounded-lg p-1.5 hover:bg-slate-800 hover:text-amber-300"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteFile(file.id)}
                          className="rounded-lg p-1.5 hover:bg-rose-950/40 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
