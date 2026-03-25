import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, FileText, FolderOpen, File, Plus, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useVirtualFileSystem, VirtualFile } from "@/hooks/useVirtualFileSystem";

export const Notepad = () => {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("Untitled.txt");
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [modified, setModified] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("Untitled.txt");
  const [selectedFolder, setSelectedFolder] = useState("documents");

  const { files, createFile, updateFile, getPath } = useVirtualFileSystem();

  const textFiles = files.filter(f => f.type === "file" && (f.extension === "txt" || f.extension === "md" || f.extension === "log"));
  const folders = files.filter(f => f.type === "folder" && f.id !== "root");

  const handleContentChange = (value: string) => {
    setContent(value);
    setModified(true);
  };

  const handleNew = () => {
    if (modified && !window.confirm("You have unsaved changes. Create new file anyway?")) return;
    setContent("");
    setFileName("Untitled.txt");
    setCurrentFileId(null);
    setModified(false);
    toast.success("✨ New file created!");
  };

  const handleSave = () => {
    if (currentFileId) {
      updateFile(currentFileId, content);
      setModified(false);
      toast.success(`💾 ${fileName} saved!`);
    } else {
      setShowSaveDialog(true);
    }
  };

  const handleSaveConfirm = () => {
    const name = newFileName.endsWith('.txt') ? newFileName : `${newFileName}.txt`;
    const newFile = createFile(name, selectedFolder, content);
    setCurrentFileId(newFile.id);
    setFileName(name);
    setModified(false);
    setShowSaveDialog(false);
    toast.success(`✅ ${name} saved successfully!`);
  };

  const handleOpen = (file: VirtualFile) => {
    if (modified && !window.confirm("You have unsaved changes. Open another file anyway?")) return;
    setContent(file.content || "");
    setFileName(file.name);
    setCurrentFileId(file.id);
    setModified(false);
    setShowOpenDialog(false);
    toast.success(`📂 Opened ${file.name}`);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-primary/5">
      {/* Modern Toolbar */}
      <div className="border-b border-border bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm p-3 flex items-center gap-3 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              {fileName}
              {modified && <span className="text-xs text-primary">● unsaved</span>}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentFileId ? getPath(currentFileId) : "Not saved yet"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleNew} 
            title="New file"
            className="hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowOpenDialog(true)} 
            title="Open file"
            className="hover:bg-primary/10"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            Open
          </Button>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 gap-2 shadow-lg" 
            onClick={handleSave}
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 p-6">
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start typing your notes... ✨"
          className="h-full border-2 border-border/50 rounded-2xl resize-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary font-mono text-base bg-card/30 backdrop-blur-sm shadow-inner"
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-border px-4 py-2 bg-muted/50 backdrop-blur-sm flex justify-between items-center text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {content.length} chars
          </span>
          <span>•</span>
          <span>{content.trim() ? content.trim().split(/\s+/).length : 0} words</span>
          <span>•</span>
          <span>{content.split('\n').length} lines</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            {modified ? "📝 Modified" : "✅ Saved"}
          </span>
        </div>
        <div className="text-xs">
          {currentFileId ? "📁 " + getPath(currentFileId) : "💾 Save to keep your work"}
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5 text-primary" />
              Save Your File
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">File name</label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="my-document.txt"
                className="focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                Choose folder
              </label>
              <div className="grid grid-cols-2 gap-2">
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedFolder === folder.id 
                        ? "border-primary bg-primary/10 shadow-lg scale-105" 
                        : "border-border hover:bg-muted/50 hover:border-primary/30"
                    }`}
                  >
                    <div className="text-sm font-medium">{folder.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveConfirm} className="gap-2">
              <Save className="w-4 h-4" />
              Save File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open Dialog */}
      <Dialog open={showOpenDialog} onOpenChange={setShowOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Open a File
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-80">
            <div className="space-y-2 p-1">
              {textFiles.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">No text files yet</p>
                  <p className="text-xs text-muted-foreground/70">Create one by saving your work!</p>
                </div>
              ) : (
                textFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={() => handleOpen(file)}
                    className="w-full p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/50 text-left transition-all flex items-center gap-3 group"
                  >
                    <File className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        📁 {getPath(file.id)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};