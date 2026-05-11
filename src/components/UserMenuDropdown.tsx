import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings, Github, User } from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
}

export function UserMenuDropdown({ onOpenSettings }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <User className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <div className="font-medium">Local user</div>
          <div className="text-xs text-muted-foreground">All data stored on your device</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onOpenSettings}>
          <Settings className="w-4 h-4 mr-2" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <Github className="w-4 h-4 mr-2" /> GitHub
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
