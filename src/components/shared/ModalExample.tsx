import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalExampleProps {
  triggerText?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export const ModalExample: React.FC<ModalExampleProps> = ({
  triggerText = "Open Modal",
  title = "Example Modal",
  description = "This is a modal component added to the project.",
  children,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {children || (
            <p className="text-sm text-muted-foreground">
              You can place any content here. This modal is built using Radix UI and Tailwind CSS.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
