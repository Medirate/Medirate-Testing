interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    width?: string;
    className?: string;
    showCloseButton?: boolean;
  }
  
  export default function Modal({ isOpen, onClose, children, width = 'max-w-md', className = '', showCloseButton = true }: ModalProps) {
    if (!isOpen) return null;
  
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
        <div className={`${width} w-full mx-4 bg-white rounded-lg shadow-lg overflow-hidden`}>
          {showCloseButton && (
            <div className="flex justify-end p-4">
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    );
  }