import useCoreUIContext from '../../hooks/useCoreUIContext';

export interface AccessProps {
  accessible: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const Access: React.FC<AccessProps> = ({ accessible, fallback, children }) => {
  const { access } = useCoreUIContext();
  const Host = access?.Access;
  if (Host) {
    return (
      <Host accessible={accessible} fallback={fallback}>
        {children}
      </Host>
    );
  }
  // Host hasn't wired access (e.g. login surface); fall back to the
  // boolean so the gate still works without the host component.
  if (accessible) {
    return <>{children}</>;
  }
  return <>{fallback ?? null}</>;
};

export default Access;
