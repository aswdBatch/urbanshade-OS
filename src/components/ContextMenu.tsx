import { useEffect, useRef, useState } from "react";
import { 
  FileText, 
  FolderPlus, 
  Trash2, 
  Copy, 
  RefreshCw, 
  Monitor, 
  SortAsc, 
  LayoutGrid,
  Palette,
  Cloud,
  ChevronRight
} from "lucide-react";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  separator?: boolean;
  shortcut?: string;
  submenu?: MenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

const SubMenu = ({ items, parentRect }: { items: MenuItem[]; parentRect: DOMRect }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: parentRect.right, top: parentRect.top });

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      let x = parentRect.right + 2;
      let y = parentRect.top;
      if (x + rect.width > window.innerWidth) x = parentRect.left - rect.width - 2;
      if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 8;
      setPos({ left: x, top: y });
    }
  }, [parentRect]);

  return (
    <div
      ref={ref}
      className="fixed z-[1000] min-w-[180px] rounded-xl glass-panel border border-border shadow-2xl animate-scale-in py-2"
      style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.separator ? (
            <div className="my-2 mx-3 border-t border-border/30" />
          ) : (
            <button
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-primary/10 transition-colors"
            >
              {item.icon && <span className="text-primary w-4 h-4 flex items-center justify-center">{item.icon}</span>}
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && <span className="text-[10px] text-muted-foreground ml-2">{item.shortcut}</span>}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<number | null>(null);
  const [submenuRect, setSubmenuRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 400);

  return (
    <div
      ref={menuRef}
      className="fixed z-[999] min-w-[220px] rounded-xl glass-panel border border-border shadow-2xl animate-scale-in py-2"
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator ? (
            <div className="my-2 mx-3 border-t border-border/30" />
          ) : (
            <div
              className="relative"
              onMouseEnter={(e) => {
                if (item.submenu) {
                  setHoveredSubmenu(index);
                  setSubmenuRect((e.currentTarget as HTMLElement).getBoundingClientRect());
                }
              }}
              onMouseLeave={() => { if (item.submenu) setHoveredSubmenu(null); }}
            >
              <button
                onClick={() => {
                  if (!item.submenu) { item.action(); onClose(); }
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors group"
              >
                {item.icon && <span className="text-primary w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
                {item.shortcut && <span className="text-[10px] text-muted-foreground">{item.shortcut}</span>}
                {item.submenu && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              </button>
              {item.submenu && hoveredSubmenu === index && submenuRect && (
                <SubMenu items={item.submenu} parentRect={submenuRect} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const getDesktopMenuItems = (
  onNewFolder: () => void,
  onSettings: () => void,
  onRefresh?: () => void,
  onSyncNow?: () => void,
  isOnlineMode?: boolean
): MenuItem[] => {
  const items: MenuItem[] = [
    {
      label: "View",
      icon: <LayoutGrid className="w-4 h-4" />,
      action: () => {},
      submenu: [
        { label: "Large icons", action: () => {}, icon: <LayoutGrid className="w-4 h-4" /> },
        { label: "Small icons", action: () => {}, icon: <LayoutGrid className="w-4 h-4" /> },
        { label: "List", action: () => {}, icon: <LayoutGrid className="w-4 h-4" /> },
      ]
    },
    {
      label: "Sort by",
      icon: <SortAsc className="w-4 h-4" />,
      action: () => {},
      submenu: [
        { label: "Name", action: () => {} },
        { label: "Date modified", action: () => {} },
        { label: "Type", action: () => {} },
        { label: "Size", action: () => {} },
      ]
    },
    {
      label: "Refresh",
      icon: <RefreshCw className="w-4 h-4" />,
      action: onRefresh || (() => window.location.reload()),
      shortcut: "Ctrl+R"
    },
    { separator: true } as MenuItem,
    {
      label: "New",
      icon: <FolderPlus className="w-4 h-4" />,
      action: () => {},
      submenu: [
        { label: "Folder", action: onNewFolder, icon: <FolderPlus className="w-4 h-4" /> },
        { label: "Text File", action: () => {}, icon: <FileText className="w-4 h-4" /> },
      ]
    },
    { separator: true } as MenuItem,
    {
      label: "Display Settings",
      icon: <Monitor className="w-4 h-4" />,
      action: onSettings
    },
    {
      label: "Personalize",
      icon: <Palette className="w-4 h-4" />,
      action: onSettings
    }
  ];

  if (isOnlineMode && onSyncNow) {
    items.push({ separator: true } as MenuItem);
    items.push({
      label: "Sync Now",
      icon: <Cloud className="w-4 h-4" />,
      action: onSyncNow
    });
  }

  return items;
};

export const getFileMenuItems = (
  fileName: string,
  onDelete: () => void,
  onCopy: () => void
): MenuItem[] => [
  {
    label: "Open",
    icon: <FileText className="w-4 h-4" />,
    action: () => {}
  },
  {
    label: "Copy",
    icon: <Copy className="w-4 h-4" />,
    action: onCopy,
    shortcut: "Ctrl+C"
  },
  { separator: true } as MenuItem,
  {
    label: "Delete",
    icon: <Trash2 className="w-4 h-4" />,
    action: onDelete,
    shortcut: "Del"
  }
];
