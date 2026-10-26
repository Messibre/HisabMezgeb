import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BottomSheet from '@/components/common/BottomSheet';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toaster from '@/components/common/Toaster';
import { toast } from 'sonner';

describe('M7 Overlays & Feedback Components', () => {
  describe('BottomSheet', () => {
    it('renders title, children, and handle when open', () => {
      render(
        <BottomSheet
          open={true}
          onOpenChange={vi.fn()}
          title="Add Customer"
        >
          <div>Customer Form Content</div>
        </BottomSheet>
      );
      expect(screen.getByText('Add Customer')).toBeInTheDocument();
      expect(screen.getByText('Customer Form Content')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-sheet-handle')).toBeInTheDocument();
    });

    it('calls onOpenChange when close action is triggered', () => {
      const onOpenChange = vi.fn();
      render(
        <BottomSheet
          open={true}
          onOpenChange={onOpenChange}
          title="Edit Entry"
        >
          <div>Content</div>
        </BottomSheet>
      );
      // vaul overlay or escape
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('ConfirmDialog', () => {
    it('renders title, message, cancel and confirm buttons', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <ConfirmDialog
          open={true}
          onOpenChange={vi.fn()}
          title="Delete Entry"
          message="Are you sure you want to delete this record? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.getByText('Delete Entry')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete this record/i)).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalledTimes(1);

      const confirmBtn = screen.getByRole('button', { name: 'Delete' });
      fireEvent.click(confirmBtn);
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('does not render when open is false', () => {
      render(
        <ConfirmDialog
          open={false}
          onOpenChange={vi.fn()}
          title="Delete Entry"
          message="Are you sure?"
          onConfirm={vi.fn()}
        />
      );
      expect(screen.queryByText('Delete Entry')).not.toBeInTheDocument();
    });
  });

  describe('Toaster', () => {
    it('renders sonner toaster container', () => {
      render(<Toaster />);
      expect(screen.getByLabelText(/Notifications/i)).toBeInTheDocument();
    });

    it('displays toast message when toast is called', async () => {
      render(<Toaster />);
      toast('Record saved successfully');
      expect(await screen.findByText('Record saved successfully')).toBeInTheDocument();
    });
  });
});
