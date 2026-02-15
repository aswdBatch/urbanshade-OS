import { useState, useEffect, useCallback } from "react";
import { 
  Folder, File, Trash2, Home, Search, Grid3x3, List, ChevronRight, ChevronDown,
  FileText, Image as ImageIcon, Music, Video, Archive, Lock, AlertTriangle, 
  Plus, FolderPlus, Copy, Scissors, Clipboard, Star, StarOff, RotateCcw,
  MoreVertical, Edit, Download, Upload, RefreshCw, HardDrive, Clock
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useVirtualFileSystem, VirtualFile } from "@/hooks/useVirtualFileSystem";

interface FileExplorerProps {
  onLog?: (action: string) => void;
  onVirusDetected?: () => void;
  initialPath?: string;
}

const getFileIcon = (file: VirtualFile, size: "sm" | "md" | "lg" = "md") => {
  const sizeClass = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-5 h-5";
  
  if (file.type === "folder") {
    if (file.id === "trash") return <Trash2 className={`${sizeClass} text-muted-foreground`} />;
    if (file.isSystem) return <Folder className={`${sizeClass} text-amber-500`} />;
    return <Folder className={`${sizeClass} text-primary`} />;
  }
  
  const ext = file.extension?.toLowerCase();
  if (ext === 'txt' || ext === 'md') return <FileText className={`${sizeClass} text-blue-400`} />;
  if (['jpg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return <ImageIcon className={`${sizeClass} text-green-400`} />;
  if (['mp3', 'wav', 'ogg', 'flac'].includes(ext || '')) return <Music className={`${sizeClass} text-purple-400`} />;
  if (['mp4', 'avi', 'mkv', 'webm'].includes(ext || '')) return <Video className={`${sizeClass} text-red-400`} />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return <Archive className={`${sizeClass} text-amber-400`} />;
  if (ext === 'sys' || ext === 'dll') return <File className={`${sizeClass} text-amber-500`} />;
  return <File className={`${sizeClass} text-muted-foreground`} />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const FileExplorer = ({ onLog, onVirusDetected, initialPath }: FileExplorerProps) => {
  const vfs = useVirtualFileSystem();
  const [currentFolderId, setCurrentFolderId] = useState("root");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  
  // Dialogs
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; file: VirtualFile | null }>({ open: false, file: null });
  const [newName, setNewName] = useState("");
  const [createDialog, setCreateDialog] = useState<{ open: boolean; type: "file" | "folder" }>({ open: false, type: "file" });
  const [newItemName, setNewItemName] = useState("");
  const [previewFile, setPreviewFile] = useState<VirtualFile | null>(null);

  // Navigate to initial path if provided
  useEffect(() => {
    if (initialPath) {
      const file = vfs.getFileByPath(initialPath);
      if (file && file.type === "folder") {
        setCurrentFolderId(file.id);
      }
    }
  }, [initialPath]);

  const currentFolder = vfs.getFile(currentFolderId);
  const currentChildren = vfs.getChildren(currentFolderId, showHidden);
  const breadcrumbs = vfs.getParents(currentFolderId);
  if (currentFolder && currentFolder.id !== "root") {
    breadcrumbs.push(currentFolder);
  }

  const filteredFiles = searchQuery
    ? vfs.searchFiles(searchQuery, { includeHidden: showHidden })
    : currentChildren;

  const navigateTo = useCallback((folderId: string) => {
    const folder = vfs.getFile(folderId);
    if (folder && folder.type === "folder") {
      setCurrentFolderId(folderId);
      setSelectedFiles(new Set());
      setSearchQuery("");
      onLog?.(`Navigated to ${vfs.getPath(folderId)}`);
    }
  }, [vfs, onLog]);

  const goUp = useCallback(() => {
    if (currentFolder && currentFolder.parentId) {
      navigateTo(currentFolder.parentId);
    }
  }, [currentFolder, navigateTo]);

  const toggleFolderExpand = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleFileClick = useCallback((file: VirtualFile, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedFiles(prev => {
        const next = new Set(prev);
        if (next.has(file.id)) {
          next.delete(file.id);
        } else {
          next.add(file.id);
        }
        return next;
      });
    } else {
      setSelectedFiles(new Set([file.id]));
      if (file.type === "file") {
        setPreviewFile(file);
      }
    }
  }, []);

  const handleFileDoubleClick = useCallback((file: VirtualFile) => {
    if (file.type === "folder") {
      navigateTo(file.id);
      toggleFolderExpand(file.id);
    } else {
      setPreviewFile(file);
      onLog?.(`Opened file: ${file.name}`);
    }
  }, [navigateTo, toggleFolderExpand, onLog]);

  const handleDelete = useCallback(() => {
    selectedFiles.forEach(id => {
      const file = vfs.getFile(id);
      if (file) {
        if (file.isSystem) {
          toast.error(`Cannot delete system file: ${file.name}`);
          return;
        }
        if (currentFolderId === "trash") {
          // Permanently delete from trash
          vfs.deleteFile(id, true);
          toast.success(`Permanently deleted ${file.name}`);
        } else {
          vfs.deleteFile(id);
          toast.success(`Moved ${file.name} to Trash`);
        }
        onLog?.(`Deleted: ${file.name}`);
      }
    });
    setSelectedFiles(new Set());
    setPreviewFile(null);
  }, [selectedFiles, vfs, currentFolderId, onLog]);

  const handleCopy = useCallback(() => {
    const first = Array.from(selectedFiles)[0];
    if (first) {
      vfs.copyToClipboard(first);
      toast.success("Copied to clipboard");
    }
  }, [selectedFiles, vfs]);

  const handleCut = useCallback(() => {
    const first = Array.from(selectedFiles)[0];
    if (first) {
      vfs.cutToClipboard(first);
      toast.success("Cut to clipboard");
    }
  }, [selectedFiles, vfs]);

  const handlePaste = useCallback(() => {
    const result = vfs.pasteFromClipboard(currentFolderId);
    if (result) {
      toast.success(`Pasted ${result.name}`);
      onLog?.(`Pasted: ${result.name}`);
    } else {
      toast.error("Nothing to paste or cannot paste here");
    }
  }, [vfs, currentFolderId, onLog]);

  const handleRename = useCallback(() => {
    if (renameDialog.file && newName.trim()) {
      if (vfs.nameExistsInFolder(newName, renameDialog.file.parentId || "root", renameDialog.file.id)) {
        toast.error("A file with this name already exists");
        return;
      }
      vfs.renameFile(renameDialog.file.id, newName.trim());
      toast.success(`Renamed to ${newName}`);
      onLog?.(`Renamed: ${renameDialog.file.name} → ${newName}`);
      setRenameDialog({ open: false, file: null });
      setNewName("");
    }
  }, [renameDialog, newName, vfs, onLog]);

  const handleCreate = useCallback(() => {
    if (newItemName.trim()) {
      if (vfs.nameExistsInFolder(newItemName, currentFolderId)) {
        toast.error("A file with this name already exists");
        return;
      }
      if (createDialog.type === "folder") {
        vfs.createFolder(newItemName.trim(), currentFolderId);
        toast.success(`Created folder: ${newItemName}`);
      } else {
        vfs.createFile(newItemName.trim(), currentFolderId, "");
        toast.success(`Created file: ${newItemName}`);
      }
      onLog?.(`Created: ${newItemName}`);
      setCreateDialog({ open: false, type: "file" });
      setNewItemName("");
    }
  }, [createDialog, newItemName, vfs, currentFolderId, onLog]);

  const handleToggleFavorite = useCallback((file: VirtualFile) => {
    if (vfs.isFavorite(file.id)) {
      vfs.removeFromFavorites(file.id);
      toast.success(`Removed ${file.name} from favorites`);
    } else {
      vfs.addToFavorites(file.id);
      toast.success(`Added ${file.name} to favorites`);
    }
  }, [vfs]);

  // Render folder tree recursively
  const renderTreeNode = (folderId: string, depth: number = 0) => {
    const folder = vfs.getFile(folderId);
    if (!folder) return null;

    const children = vfs.getChildren(folderId, showHidden).filter(f => f.type === "folder");
    const isExpanded = expandedFolders.has(folderId);
    const isSelected = currentFolderId === folderId;

    return (
      <div key={folderId}>
        <button
          onClick={() => navigateTo(folderId)}
          className={`w-full flex items-center gap-1 px-2 py-1.5 text-sm rounded-md transition-all ${
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {children.length > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleFolderExpand(folderId); }}
              className="p-0.5 hover:bg-background/20 rounded"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          {getFileIcon(folder, "sm")}
          <span className="truncate flex-1 text-left">{folder.name}</span>
          {vfs.isFavorite(folderId) && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
        </button>
        {isExpanded && children.map(child => renderTreeNode(child.id, depth + 1))}
      </div>
    );
  };

  const quickAccess = [
    { id: "root", name: "Home", icon: Home },
    { id: "desktop", name: "Desktop", icon: HardDrive },
    { id: "documents", name: "Documents", icon: FileText },
    { id: "downloads", name: "Downloads", icon: Download },
    { id: "pictures", name: "Pictures", icon: ImageIcon },
    { id: "trash", name: "Trash", icon: Trash2 },
  ];

  return (
    <div className="h-full flex bg-gradient-to-br from-background to-primary/5">
      {/* Sidebar */}
      <div className="w-56 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col">
        {/* Quick Access */}
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-xs text-muted-foreground mb-2">QUICK ACCESS</h3>
          <div className="space-y-0.5">
            {quickAccess.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-all ${
                    currentFolderId === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Favorites */}
        {vfs.favorites.length > 0 && (
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-xs text-muted-foreground mb-2">FAVORITES</h3>
            <div className="space-y-0.5">
              {vfs.favorites.map(id => {
                const file = vfs.getFile(id);
                if (!file) return null;
                return (
                  <button
                    key={id}
                    onClick={() => file.type === "folder" ? navigateTo(id) : setPreviewFile(file)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-muted transition-all"
                  >
                    {getFileIcon(file, "sm")}
                    <span className="truncate">{file.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Folder Tree */}
        <div className="flex-1 overflow-hidden">
          <div className="p-3 pb-1">
            <h3 className="font-semibold text-xs text-muted-foreground">FOLDERS</h3>
          </div>
          <ScrollArea className="h-full pb-20">
            <div className="px-2 pb-4">
              {renderTreeNode("root")}
            </div>
          </ScrollArea>
        </div>

        {/* Storage Info */}
        <div className="p-3 border-t border-border">
          <div className="text-xs text-muted-foreground mb-1">Storage</div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: '35%' }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1">23.5 GB free of 64 GB</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="border-b bg-muted/30 p-2 flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={goUp} disabled={currentFolderId === "root"}>
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigateTo("root")}>
            <Home className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => setCurrentFolderId(currentFolderId)}>
            <RefreshCw className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
            <button onClick={() => navigateTo("root")} className="px-2 py-1 hover:bg-muted rounded text-sm shrink-0">/</button>
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.id} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <button
                  onClick={() => navigateTo(crumb.id)}
                  className="px-2 py-1 hover:bg-muted rounded text-sm"
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')}>
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button size="sm" variant={viewMode === 'list' ? 'default' : 'outline'} onClick={() => setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="border-b bg-background/50 p-2 flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => { setCreateDialog({ open: true, type: "folder" }); setNewItemName("New Folder"); }}>
            <FolderPlus className="w-4 h-4 mr-1" /> New Folder
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setCreateDialog({ open: true, type: "file" }); setNewItemName("New File.txt"); }}>
            <Plus className="w-4 h-4 mr-1" /> New File
          </Button>
          
          <div className="h-4 w-px bg-border mx-1" />
          
          <Button size="sm" variant="outline" onClick={handleCopy} disabled={selectedFiles.size === 0}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCut} disabled={selectedFiles.size === 0}>
            <Scissors className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handlePaste} disabled={!vfs.clipboard}>
            <Clipboard className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleDelete} disabled={selectedFiles.size === 0}>
            <Trash2 className="w-4 h-4" />
          </Button>

          <div className="flex-1" />

          <div className="relative w-48">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 flex overflow-hidden">
          <ScrollArea className="flex-1">
            <div className={`p-3 ${viewMode === 'grid' ? 'grid grid-cols-6 gap-2' : 'space-y-0.5'}`}>
              {currentFolderId === "trash" && vfs.trash.length > 0 && (
                <div className={`${viewMode === 'grid' ? 'col-span-6' : ''} mb-2`}>
                  <Button size="sm" variant="outline" onClick={() => vfs.emptyTrash()}>
                    <Trash2 className="w-4 h-4 mr-1" /> Empty Trash
                  </Button>
                  <Button size="sm" variant="outline" className="ml-2" onClick={() => {
                    vfs.trash.forEach((_, i) => vfs.restoreFromTrash(0));
                    toast.success("Restored all items");
                  }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> Restore All
                  </Button>
                </div>
              )}

              {filteredFiles.length === 0 ? (
                <div className={`${viewMode === 'grid' ? 'col-span-6' : ''} text-center py-12 text-muted-foreground`}>
                  {searchQuery ? 'No files match your search' : currentFolderId === "trash" ? 'Trash is empty' : 'Folder is empty'}
                </div>
              ) : (
                filteredFiles.map((file) => (
                  viewMode === 'grid' ? (
                    <Card
                      key={file.id}
                      draggable={!file.isSystem}
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', file.id); setDraggedFileId(file.id); }}
                      onDragEnd={() => { setDraggedFileId(null); setDragOverFolderId(null); }}
                      onDragOver={(e) => { if (file.type === 'folder') { e.preventDefault(); setDragOverFolderId(file.id); } }}
                      onDragLeave={() => setDragOverFolderId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        const srcId = e.dataTransfer.getData('text/plain');
                        if (srcId && file.type === 'folder' && srcId !== file.id) {
                          vfs.moveFile(srcId, file.id);
                          toast.success(`Moved to ${file.name}`);
                        }
                        setDragOverFolderId(null);
                      }}
                      className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${
                        selectedFiles.has(file.id) ? 'ring-2 ring-primary bg-primary/10' : ''
                      } ${file.isHidden ? 'opacity-60' : ''} ${dragOverFolderId === file.id ? 'drop-target-active' : ''} ${draggedFileId === file.id ? 'opacity-40' : ''}`}
                      onClick={(e) => handleFileClick(file, e)}
                      onDoubleClick={() => handleFileDoubleClick(file)}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        {getFileIcon(file, "lg")}
                        <div className="text-xs truncate w-full font-medium">{file.name}</div>
                        <div className="flex gap-1">
                          {file.isReadOnly && <Lock className="w-3 h-3 text-amber-500" />}
                          {file.isSystem && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          {vfs.isFavorite(file.id) && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <div
                      key={file.id}
                      draggable={!file.isSystem}
                      onDragStart={(e) => { e.dataTransfer.setData('text/plain', file.id); setDraggedFileId(file.id); }}
                      onDragEnd={() => { setDraggedFileId(null); setDragOverFolderId(null); }}
                      onDragOver={(e) => { if (file.type === 'folder') { e.preventDefault(); setDragOverFolderId(file.id); } }}
                      onDragLeave={() => setDragOverFolderId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        const srcId = e.dataTransfer.getData('text/plain');
                        if (srcId && file.type === 'folder' && srcId !== file.id) {
                          vfs.moveFile(srcId, file.id);
                          toast.success(`Moved to ${file.name}`);
                        }
                        setDragOverFolderId(null);
                      }}
                      className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all hover:bg-muted/50 ${
                        selectedFiles.has(file.id) ? 'bg-primary/10 ring-1 ring-primary' : ''
                      } ${file.isHidden ? 'opacity-60' : ''} ${dragOverFolderId === file.id ? 'drop-target-active' : ''} ${draggedFileId === file.id ? 'opacity-40' : ''}`}
                      onClick={(e) => handleFileClick(file, e)}
                      onDoubleClick={() => handleFileDoubleClick(file)}
                    >
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                      </div>
                      <div className="text-xs text-muted-foreground w-20 text-right">
                        {file.type === "folder" ? `${vfs.getChildren(file.id).length} items` : formatFileSize(file.size)}
                      </div>
                      <div className="text-xs text-muted-foreground w-32">
                        {formatDate(file.modifiedAt)}
                      </div>
                      <div className="flex gap-1 items-center w-16 justify-end">
                        {file.isReadOnly && <Lock className="w-3 h-3 text-amber-500" />}
                        {file.isSystem && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                        {vfs.isFavorite(file.id) && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[999999] bg-background border border-border">
                          <DropdownMenuItem onClick={() => { setRenameDialog({ open: true, file }); setNewName(file.name); }}>
                            <Edit className="w-4 h-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleFavorite(file)}>
                            {vfs.isFavorite(file.id) ? (
                              <><StarOff className="w-4 h-4 mr-2" /> Remove from Favorites</>
                            ) : (
                              <><Star className="w-4 h-4 mr-2" /> Add to Favorites</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { vfs.copyToClipboard(file.id); toast.success("Copied"); }}>
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { vfs.cutToClipboard(file.id); toast.success("Cut"); }}>
                            <Scissors className="w-4 h-4 mr-2" /> Cut
                          </DropdownMenuItem>
                          {!file.isSystem && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setSelectedFiles(new Set([file.id])); handleDelete(); }} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                ))
              )}

              {/* Show trash items when in trash folder */}
              {currentFolderId === "trash" && vfs.trash.map((item, index) => (
                viewMode === 'list' && (
                  <div
                    key={`trash-${index}`}
                    className="flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all hover:bg-muted/50 opacity-70"
                  >
                    {getFileIcon(item.file)}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.file.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Deleted {formatDate(item.deletedAt)}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { vfs.restoreFromTrash(index); toast.success(`Restored ${item.file.name}`); }}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                )
              ))}
            </div>
          </ScrollArea>

          {/* Preview Panel */}
          {previewFile && (
            <div className="w-72 border-l bg-card/50 flex flex-col">
              <div className="p-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Preview</h3>
                <Button size="sm" variant="ghost" onClick={() => setPreviewFile(null)}>×</Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <div className="flex flex-col items-center gap-3 py-4">
                    {getFileIcon(previewFile, "lg")}
                    <div className="font-semibold text-center break-all text-sm">{previewFile.name}</div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>{previewFile.type === 'folder' ? 'Folder' : (previewFile.extension?.toUpperCase() || 'File')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span>{previewFile.type === 'folder' ? `${vfs.getChildren(previewFile.id).length} items` : formatFileSize(previewFile.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatDate(previewFile.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modified</span>
                      <span>{formatDate(previewFile.modifiedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Path</span>
                      <span className="text-right truncate max-w-32">{vfs.getPath(previewFile.id)}</span>
                    </div>
                  </div>

                  {previewFile.isReadOnly && (
                    <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded text-amber-500 text-xs flex items-center gap-2">
                      <Lock className="w-3 h-3" /> Read Only
                    </div>
                  )}
                  {previewFile.isSystem && (
                    <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded text-amber-500 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> System File
                    </div>
                  )}

                  {previewFile.content && previewFile.type === "file" && (
                    <div className="pt-3 border-t">
                      <div className="text-xs font-semibold mb-2 text-muted-foreground">CONTENT</div>
                      <pre className="text-xs font-mono bg-muted p-3 rounded whitespace-pre-wrap max-h-48 overflow-auto">
                        {previewFile.content}
                      </pre>
                    </div>
                  )}

                  <div className="pt-3 border-t flex flex-col gap-2">
                    <Button size="sm" variant="outline" className="w-full" onClick={() => handleToggleFavorite(previewFile)}>
                      {vfs.isFavorite(previewFile.id) ? (
                        <><StarOff className="w-4 h-4 mr-2" /> Remove Favorite</>
                      ) : (
                        <><Star className="w-4 h-4 mr-2" /> Add to Favorites</>
                      )}
                    </Button>
                    {!previewFile.isSystem && (
                      <Button size="sm" variant="outline" className="w-full" onClick={() => { setRenameDialog({ open: true, file: previewFile }); setNewName(previewFile.name); }}>
                        <Edit className="w-4 h-4 mr-2" /> Rename
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="border-t bg-muted/30 px-3 py-1 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{filteredFiles.length} items</span>
          {selectedFiles.size > 0 && <span>{selectedFiles.size} selected</span>}
          {vfs.clipboard && <span className="text-primary">Clipboard: {vfs.clipboard.operation}</span>}
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, file: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRename()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, file: null })}>Cancel</Button>
            <Button onClick={handleRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialog.open} onOpenChange={(open) => setCreateDialog({ open, type: "file" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {createDialog.type === "folder" ? "Folder" : "File"}</DialogTitle>
          </DialogHeader>
          <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog({ open: false, type: "file" })}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
