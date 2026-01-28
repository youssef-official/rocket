import React, { useState } from 'react';
import { SettingsModal } from '@/components/dashboard/SettingsModal';
import { useNavigate } from 'react-router-dom';
import { HomePage } from '@/components/home/HomePage';

const Settings = () => {
  const navigate = useNavigate();
  // Open by default
  const [open, setOpen] = useState(true);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      navigate(-1); // Go back when closed
    }
  };

  return (
    <>
       {/* Render a background (Home) so it looks like an overlay */}
       <div className="fixed inset-0 pointer-events-none opacity-50 blur-sm">
          {/* We could render HomePage here but it might fetch data.
              Just a placeholder background or empty is fine if we assume
              the user came from somewhere else.
              But for direct link, let's just show a nice background.
          */}
          <div className="w-full h-full bg-background" />
       </div>
       <SettingsModal open={open} onOpenChange={handleOpenChange} />
    </>
  );
};

export default Settings;
